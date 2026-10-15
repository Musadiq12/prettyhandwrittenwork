# Security policy

## Reporting

Do not publish exploit details, customer information, access tokens, or credentials in public issues. Report suspected vulnerabilities privately to the repository owner.

## Secrets

- Never commit `.env`, `.env.local`, service-role keys, database connection strings, private keys, or deployment tokens.
- `.env.example` may contain placeholders only.
- Vite exposes `VITE_*` variables to browser bundles. Only use them for intentionally public values, such as a Supabase publishable key.
- If a credential was committed, remove it from the working tree and rotate/revoke it at the issuing service. Rewriting Git history does not replace rotation.

## Deployment checklist

- Store server-only keys in the hosting provider's encrypted environment settings; never use a `VITE_*` prefix for secrets.
- Keep Supabase Row Level Security enabled for every table exposed through the API. Confirm policies and grants against the deployed database, not only the SQL files in this repository.
- Test public RPCs and storage access with anonymous and non-admin credentials.
- Apply rate limiting to public server functions that reveal customer-specific data. Do not trust client-provided IP headers for throttling.
- Configure HTTPS, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and framing protections at the hosting edge/runtime.
- Introduce Content Security Policy in report-only mode first. Verify the required fonts, images, scripts, and API endpoints before enforcement.
- Restrict CORS to known origins if custom API endpoints need CORS; do not combine wildcard origins with credentialed requests.
- Run the dependency audit, linter, tests, production build, and historical secret scanning before release.
- Use a strong password, MFA for owner/admin accounts where supported, and least-privilege access.
