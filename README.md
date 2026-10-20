# Spedire Kenya — exporter workspace

A React/Vite application for comparing indicative air freight estimates from Nairobi, requesting bookings, and managing private shipment documents. Supabase provides authentication, Postgres and private object storage. An optional Edge Function uses OpenAI to extract document fields for human review.

## What changed

- A lighter, responsive workspace: **New Quote → My Shipments → Help**, with a separate staff work queue and rate management.
- Email/password registration, confirmation, sign-in, password reset and session restoration through Supabase Auth. No demo credentials or customer records are imported.
- Database-owned shipment requests and immutable quote snapshots. The server recalculates totals, checks expiry and rejects a changed estimate. A request key makes retries idempotent.
- Private PDF/JPG/PNG uploads (10 MB maximum) and downloads of original files. New files await staff review; uploading does not verify a certificate.
- Document checklists, staff feedback, attributable reviews, shipment activity and controlled status transitions.
- Optional AI extraction with explicit consent, original-text evidence, discrepancy warnings, retry limits and no automatic approval.
- No manufactured flight capacity, live-rate movements, AWBs, certificates, payment receipts or booking confirmations.

Without a database connection, the app is a **read-only preview** with clearly labelled sample rates. With a connection, it never falls back to sample shipments or local account data when a server request fails.

## Requirements

Node.js 22+, npm, and either a Supabase project or Docker for the local stack.

```bash
npm ci
npm run dev
```

The frontend runs at [localhost:5173](http://localhost:5173). Routes use hashes so bookmarks and refreshes work on static hosting.

## Run the complete database locally

```bash
npx supabase start
npx supabase status
```

Copy `.env.example` to `.env.local`, then set:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable key from supabase status>
VITE_ENABLE_DOCUMENT_AI=false
```

Use the legacy local `anon` key if your local CLI does not issue a publishable key. Never put a service-role or secret key into a `VITE_` variable. Restart Vite after changing environment variables.

The first `supabase start` applies the migration and `seed.sql`. Email confirmation is enabled. Use the local Mailpit URL shown by `supabase status` to open confirmation and password-reset messages. No real email delivery is needed locally.

For a smaller local stack, omit optional services:

```bash
npx supabase start --exclude realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

This still starts Postgres, Auth, REST, Storage, the API gateway and Mailpit. AI extraction additionally needs Edge Runtime (restart with it enabled or use `supabase functions serve`). Docker volumes retain development records when the stack is stopped normally.

## Connect a hosted Supabase project

1. Create or choose the intended project. Set its Site URL and allowed redirect URLs to your frontend origin. Enable email confirmation, a minimum password length of 10 and production SMTP before sending real account email.
2. Authenticate the CLI and link the project:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. Set the project's URL and browser-safe publishable key in `.env.local` and in your hosting provider's build environment. Build with `npm run build`.
4. Add real selling rates through a staff account. Hosted `db push` does **not** import the sample seed by default. You can use `supabase/seed.sql` explicitly in a disposable staging project to try the sample catalogue; do not publish its prices as supplier-confirmed rates.
5. Run the Supabase security/performance advisors and smoke tests against the chosen project before opening access to customers.

The migration uses explicit grants and row-level security, including projects that disable automatic Data API exposure. It creates one private bucket, `shipment-documents`. Migrations are versioned under `supabase/migrations`; do not rerun the SQL manually on an already migrated project.

### Staff access

Register the staff member normally, then grant a role through a trusted administration path. For example, run this in Supabase's SQL editor as the project administrator, replacing the UUID:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"staff"}'::jsonb
where id = 'STAFF_AUTH_USER_UUID';
```

Use `staff` or `admin`. Sign out and back in after changing a role, so the token contains the new claims. Customer-editable `user_metadata` never authorizes staff access. Removing a role also requires accounting for already-issued access tokens; revoke sessions and use appropriately short JWT expiry for staff access.

Staff can review all customer shipments and attached files, manage customer-facing selling rates, leave review notes and advance requests through `requested → reviewing → confirmed → dispatched` (or cancel before dispatch). Dispatch requires a carrier-issued AWB. Document review means an internal staff check, not validation by an issuing authority.

## Optional AI document intake

Uploads and manual review work without AI. To enable extraction:

1. Choose an OpenAI model available to your API account that supports PDF/image inputs and Structured Outputs. Set `OPENAI_API_KEY` and `OPENAI_DOCUMENT_MODEL` as **server-only** Edge Function secrets, ideally using a gitignored env file:

   ```bash
   npx supabase secrets set --env-file /path/to/private-intake.env
   npx supabase functions deploy document-intake
   ```

2. Set `VITE_ENABLE_DOCUMENT_AI=true` for the frontend and rebuild/restart it.
3. Upload a real invoice or packing list to a shipment. Explicitly consent, then choose **Extract document fields**.

The function validates the bearer token with Auth and checks ownership before accessing the original file. It validates file signatures, calls the Responses API with a strict JSON schema and `store: false`, and saves suggestions separately from staff decisions. Missing or ungrounded fields are rejected or shown as missing. Files are sent to OpenAI only after the extraction action; `store: false` does not itself promise zero provider retention. Confirm provider data policies and your customer notice before enabling it for real records.

The function deliberately sets `verify_jwt=false` at the gateway because its handler explicitly verifies the bearer token, supporting current key/JWT formats. This does not make the handler anonymous. No provider key or service-role key is shipped to the browser. The model receives no tools, other shipments, internal margins or authority to approve anything.

Retries are limited to three attempts per file, with a two-minute cooldown and ten distinct document starts per account per hour. Provider timeouts and failures leave the original document available for manual review. Deploy-time OpenAI calls and extraction quality must be verified with representative real documents; an API key is not included in this repository.

## Verification

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
```

- Unit checks cover tiers, minimum charges, zero fuel fees, dimensional weight, invalid files, document requirements and malformed/refused AI output.
- Database checks apply the real migration/seed to PGlite (Postgres in WASM), with test-only Auth/Storage helper tables. They exercise real grants, RLS, ownership, protected reviews, quote recomputation, expiry, idempotency and staff transitions. They do not replace hosted Auth/Storage integration tests.
- Browser tests run the real frontend at desktop/mobile sizes with intercepted Supabase responses. They cover account confirmation/error handling, booking requests, original-file downloads, opt-in extraction, session restoration and staff navigation. They do not call a paid AI model.
- The Edge Function can be type-checked with `deno check supabase/functions/document-intake/index.ts`.

`npm run db:seed` regenerates `supabase/seed.sql` from `src/data/sampleRates.json` and never overwrites existing rate IDs.

## Structure and boundaries

- `src/context/RatesContext.jsx`: Auth lifecycle and account-scoped database/storage operations.
- `src/lib/quote.js`: deterministic customer preview; SQL independently recomputes saved estimates.
- `src/lib/documents.js`: file validation, starting checklists and field-discrepancy checks.
- `src/pages/`: quoting, shipment/documents and staff rate management.
- `supabase/migrations/`: schema, ownership policies, private storage and controlled operations.
- `supabase/functions/document-intake/`: optional authenticated extraction endpoint.

Each account owns its own shipments in this release; shared company membership/invitations are not implemented. Payments, carrier integrations, live flight inventory, official certificate verification, automatic tracking and compliance advice are not implemented. Local fee defaults are carried forward as **indicative assumptions**, not validated tariffs or tax advice. Review fee applicability, document requirements and supplier rates with the business before operational use.

File upload and database metadata insert are separate operations; the client removes an unattached file after a metadata failure. A lost connection or a closed browser can leave orphaned objects; add a scheduled cleanup/reconciliation job and malware scanning before expanding to broad public uploads. File content/signature checks are not a malware scanner. No destructive file/account deletion is exposed in the UI; retention and offboarding need an operator workflow.

### Real local service smoke test

In addition to the automated unit/database/browser suites, `scripts/local-integration.mjs` checks the running local stack. It registers two disposable accounts, confirms email through Mailpit, signs in, submits an estimate, stores/downloads original bytes, verifies isolation, and removes its test users/files. It refuses non-local API URLs.

To rerun after `supabase start`, capture local status in a private temporary file, then pass its path:

```bash
(umask 077; npx supabase status --output json > /tmp/freight-local-status.json)
npm run test:integration -- /tmp/freight-local-status.json
rm /tmp/freight-local-status.json
```

That status file contains development-only service credentials; keep it outside the repository. Hosted services and live paid-model extraction need their own deployment smoke test.

Implementation references: [Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [OpenAI file inputs](https://developers.openai.com/api/docs/guides/file-inputs), and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
