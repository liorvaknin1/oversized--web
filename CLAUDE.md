# OBSIZE — obsize.com

אתר סטטי. ללא build, ללא framework.

## Stack
- HTML / CSS / vanilla JS
- Deploy דרך GitHub Pages (repo: oversized--web), workflow ב-.github/workflows/deploy.yml
- DNS + SSL/security דרך Cloudflare (כל הרשומות מפורקסות)
- התראות הזמנות: Web3Forms

## מבנה
- index.html — דף הבית
- product.html — עמוד מוצר (PDP)
- checkout.html — checkout
- terms / privacy / accessibility .html — עמודי מדיניות
- *.js — סקריפט לכל אזור (script, product, products, analytics, consent, checkout)
- styles.css — סטיילשיט ראשי
- /assets/images — תמונות, lookbook, צילומי מוצר

## כללים
- ערוך רק את הקבצים שצוינו במשימה. אל תסרוק תיקיות לא רלוונטיות.
- אל תיגע ב-/assets, ב-CNAME, או בהגדרות Cloudflare/DNS אלא אם ביקשתי במפורש.
- אל תיגע ב-checkout אלא אם ביקשתי במפורש.
- mobile-first, רקע כהה הוא ברירת המחדל של המותג, עברית תמיד.
- אחרי שינוי, סכם בשורה אחת לכל קובץ — אל תדפיס קבצים מלאים מחדש.
- אם קיים session-notes.md, קרא אותו בתחילת העבודה.
- קבצים פנימיים שלא מתפרסמים (session-notes.md, SECURITY-internal.md, .gitignore) מנוקים ב-strip ב-deploy.yml — כל קובץ dev עתידי, הוסף לאותה שורה.
