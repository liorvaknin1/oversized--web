# OBSIZE — obsize.com

אתר סטטי. ללא build, ללא framework.

## Stack
- HTML / CSS / vanilla JS
- Deploy דרך GitHub Pages (repo: oversized--web), workflow ב-.github/workflows/deploy.yml
- DNS + SSL/security דרך Cloudflare (כל הרשומות מפורקסות)
- התראות הזמנות + רשימת המתנה: Web3Forms (מוגן hCaptcha)

## מבנה
- index.html — דף הבית
- shop.html — קטלוג מלא
- product.html — **תבנית** עמוד מוצר (PDP)
- product-&lt;id&gt;.html — 6 דפי מוצר **מג'ונרטים — לא לערוך ידנית** (ראה זרימת עבודה)
- checkout.html — checkout · 404.html — עמוד שגיאה
- terms / privacy / accessibility .html — עמודי מדיניות
- *.js — סקריפט לכל אזור (script, product, products, analytics, consent, checkout)
- styles.css — סטיילשיט ראשי
- products.js — **קטלוג המוצרים + דגלים גלובליים**. מקור האמת היחיד לזמינות, מחירים וסדר תצוגה.
- scripts/generate-product-pages.mjs — מג'נרט את דפי המוצר
- sitemap.xml · robots.txt · og-*.png (תמונות שיתוף)
- /assets/images — תמונות, lookbook, צילומי מוצר

## זרימת עבודה
- **אחרי שינוי ב-`products.js` או ב-`product.html`** — להריץ `node scripts/generate-product-pages.mjs`. עריכה ישירה של `product-<id>.html` תידרס.
- **אחרי שינוי ב-CSS/JS** — להעלות cache-bust בכל 8 עמודי המקור ואז לרגנרט:
  ```
  perl -pi -e 's/\?v=N\b/?v=N+1/g' index.html product.html shop.html terms.html privacy.html accessibility.html checkout.html 404.html
  ```
- **באימות אחרי דיפלוי** — תמיד רענון קשיח. ל-HTML אין `?v=`, אז הדפדפן מגיש עותק ישן שמפנה ל-JS ישן, וזה נראה כמו דיפלוי שנכשל.

## כללים
- **כל שינוי שלא מופיע ברשימת המשימות המאושרת: לעצור ולשאול לפני ביצוע.**
  זה כולל תיקונים קטנים, ניקוי קוד ועדכוני תיעוד.
- **לפני כל קומט או push, להציג את ה-diff ולשאול עם כפתורי בחירה:**
  קומט + push / קומט בלבד / לא לקמט.
- ערוך רק את הקבצים שצוינו במשימה. אל תסרוק תיקיות לא רלוונטיות.
- אל תיגע ב-/assets, ב-CNAME, או בהגדרות Cloudflare/DNS אלא אם ביקשתי במפורש.
- אל תיגע ב-checkout אלא אם ביקשתי במפורש.
- **`checkout.js` בונה payload ידני בכוונה כדי לא לשלוח פרטי אשראי — אסור לעבור ל-`new FormData(form)`.**
- **נושאי מייל מתחילים ב-`[OBSIZE]`** — פילטר הספאם בתיבה מסונן על זה. כל התראה חדשה חייבת את אותה תחילית.
- mobile-first, רקע כהה הוא ברירת המחדל של המותג, עברית תמיד.
- אחרי שינוי, סכם בשורה אחת לכל קובץ — אל תדפיס קבצים מלאים מחדש.
- אם קיים session-notes.md, קרא אותו בתחילת העבודה — שם המצב הנוכחי, המתגים והמלכודות.
- קבצים פנימיים שלא מתפרסמים (AGENTS.md, session-notes.md, SECURITY-internal.md, .gitignore) מנוקים ב-strip ב-deploy.yml — כל קובץ dev עתידי, הוסף לאותה שורה.
- AGENTS.md הוא symlink לקובץ הזה (Codex קורא AGENTS.md, Claude קורא CLAUDE.md) — ערוך רק את CLAUDE.md, שלא ייווצרו שתי גרסאות שמתפצלות.
