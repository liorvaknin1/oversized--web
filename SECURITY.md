# Security Policy — OBSIZE

## Reporting a vulnerability

If you discover a security vulnerability in the OBSIZE website, please
report it responsibly. **Do not** open a public GitHub issue for security
problems.

- **Email:** security@obsize.com
- **Preferred languages:** Hebrew, English
- Please include the affected URL, a description of the issue, and steps to
  reproduce.

We aim to acknowledge reports within a few business days.

## Scope

This repository is a **static** website (HTML, CSS, JS) served via GitHub
Pages at https://obsize.com. There is no server-side code or database in
this repository.

## Security posture

### Application layer (this repository)

- All traffic is served over HTTPS.
- A Content-Security-Policy meta tag on every page restricts script execution
  to same-origin plus vetted analytics origins (Google Tag Manager, Meta),
  and forbids `object`/`embed`, foreign base URIs, and off-site form posts.
- `Referrer-Policy: strict-origin-when-cross-origin` on every page.
- No inline event handlers or inline scripts (so `script-src` needs no
  `'unsafe-inline'`).
- An RFC 9116 disclosure file is published at
  `/.well-known/security.txt`.
- No secrets, API keys, or credentials are stored in the repository.
- Payment card data is **never** handled, stored, or transmitted by this
  site. When live payments are enabled, they are delegated to a
  PCI-DSS-compliant payment provider using hosted fields / redirect, so card
  data never touches our code.

### Network / edge layer (Cloudflare)

`obsize.com` is fronted by Cloudflare (Free plan), which proxies all traffic
to the GitHub Pages origin. Configured protections:

- **TLS:** SSL mode = Full; "Always Use HTTPS" on; **HSTS** enabled
  (`max-age` 6 months).
- **Response headers** added at the edge to every request:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (clickjacking protection)
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- **Bot Fight Mode** on, with automatic security level.
- **Rate limiting:** 100 requests / 10 seconds per IP → Block (basic
  DoS / abuse throttling).

> Note: these edge protections only apply while the `obsize.com` DNS records
> are **Proxied** (orange cloud) in Cloudflare. If a record is set to
> "DNS only" (grey cloud), traffic bypasses Cloudflare and hits GitHub Pages
> directly, and none of the above headers or rules are applied.

### Account / repository

- GitHub account protected with two-factor authentication (authenticator
  app) and stored recovery codes.
- Deployments run through GitHub Actions with read-only repository contents.

## Out of scope

- Third-party services (analytics providers, the payment processor, the
  shipping carrier) — report issues to the respective vendor.
