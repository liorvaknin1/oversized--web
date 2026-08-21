// Generates static per-product pages (product-<id>.html) from product.html +
// products.js, with SEO/OG/JSON-LD meta baked in so social scrapers (WhatsApp,
// Facebook — which don't run JS) see the right title/image per product.
//
// Run whenever products.js or product.html changes:
//   node scripts/generate-product-pages.mjs
//
// The generated files are committed (the site has no build step); deploy.yml
// also re-runs this script so the published pages can never go stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://obsize.com';

// products.js is a browser script ending in `window.PRODUCTS = PRODUCTS;` —
// evaluate it with a stub window to extract the catalog and its flags, so the
// baked pages stay in lockstep with what the runtime renders.
const catalogSource = readFileSync(join(root, 'products.js'), 'utf8');
const catalogWindow = {};
new Function('window', catalogSource)(catalogWindow);
const PRODUCTS = catalogWindow.PRODUCTS;
const SHOW_PRICES = catalogWindow.OBSIZE_SHOW_PRICES !== false;

const template = readFileSync(join(root, 'product.html'), 'utf8');

// Replace the content/href of a tag identified by its id="..." attribute.
function setAttrById(html, id, attr, value) {
  const re = new RegExp(`(<[^>]*\\bid="${id}"[^>]*\\b${attr}=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`anchor not found: id="${id}" ${attr}=`);
  return html.replace(re, `$1${escapeAttr(value)}$2`);
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

let count = 0;
for (const product of Object.values(PRODUCTS)) {
  const productUrl = `${BASE_URL}/product-${product.id}.html`;
  const ogImageUrl = product.ogImage ? `${BASE_URL}/${product.ogImage}` : `${BASE_URL}/og-image.png`;
  const shortDesc = product.description.length > 160
    ? product.description.slice(0, 157) + '…'
    : product.description;
  const seoTitle = `${product.name} — OBSIZE`;
  const ogAlt = `OBSIZE — ${product.name}`;

  let html = template;
  html = html.replace(
    /<title id="pageTitle">[^<]*<\/title>/,
    `<title id="pageTitle">${escapeAttr(seoTitle)}</title>`
  );
  html = setAttrById(html, 'metaDescription', 'content', shortDesc);
  html = setAttrById(html, 'metaCanonical', 'href', productUrl);
  html = setAttrById(html, 'metaOgTitle', 'content', seoTitle);
  html = setAttrById(html, 'metaOgDescription', 'content', shortDesc);
  html = setAttrById(html, 'metaOgUrl', 'content', productUrl);
  html = setAttrById(html, 'metaOgImage', 'content', ogImageUrl);
  html = setAttrById(html, 'metaOgImageSecure', 'content', ogImageUrl);
  html = setAttrById(html, 'metaOgImageAlt', 'content', ogAlt);
  html = setAttrById(html, 'metaTwTitle', 'content', seoTitle);
  html = setAttrById(html, 'metaTwDescription', 'content', shortDesc);
  html = setAttrById(html, 'metaTwImage', 'content', ogImageUrl);
  html = setAttrById(html, 'metaTwImageAlt', 'content', ogAlt);

  // Bake the Product JSON-LD (product.js also sets it at runtime; baking it
  // makes it visible to crawlers that don't execute JS).
  const schemaImageUrl = product.images && product.images[0]
    ? `${BASE_URL}/${encodeURI(product.images[0])}`
    : ogImageUrl;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: schemaImageUrl,
    brand: { '@type': 'Brand', name: 'OBSIZE' },
    sku: product.id,
    // Must match what product.js computes at runtime, otherwise crawlers that
    // don't execute JS read the baked value and see something else. Pre-launch
    // is PreOrder, and the price fields are omitted while pricing is unset.
    offers: Object.assign(
      {
        '@type': 'Offer',
        url: productUrl,
        availability: product.available === false
          ? 'https://schema.org/PreOrder'
          : (product.sizes.some(s => !s.soldOut)
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock'),
      },
      SHOW_PRICES ? { priceCurrency: 'ILS', price: product.price } : {}
    ),
  };
  html = html.replace(
    /(<script type="application\/ld\+json" id="productJsonLd">)[^<]*(<\/script>)/,
    `$1${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}$2`
  );

  // product.js reads the id from <body data-product-id> on these pages
  html = html.replace(/<body>/, `<body data-product-id="${escapeAttr(product.id)}">`);

  const outFile = `product-${product.id}.html`;
  writeFileSync(join(root, outFile), html);
  console.log(`✓ ${outFile}`);
  count++;
}
console.log(`generated ${count} product pages`);
