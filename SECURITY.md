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

- All traffic is served over HTTPS.
- A Content-Security-Policy restricts script execution to same-origin plus
  vetted analytics origins.
- No secrets, API keys, or credentials are stored in the repository.
- Payment card data is **never** handled, stored, or transmitted by this
  site. When live payments are enabled, they are delegated to a
  PCI-DSS-compliant payment provider using hosted fields / redirect, so card
  data never touches our code.

## Out of scope

- Third-party services (analytics providers, the payment processor, the
  shipping carrier) — report issues to the respective vendor.
