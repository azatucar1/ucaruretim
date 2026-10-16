# Vercel deployment guide (Uçar Üretim)

This monorepo deploys a Vite SPA and an Express serverless function **from the repository root**.

## Vercel project settings

- Root Directory: repository root (do **not** select `apps/web`).
- Framework preset: Other. `vercel.json` pins build and output settings.
- Install Command: `npm install`.
- Build Command: `npm run build`.
- Output Directory: `apps/web/dist`.
- `/api/*` is routed to the Express handler; non-API SPA paths fall back to `index.html`.

## Environment variables (configure in Vercel, never commit credentials)

Web build variables: `VITE_DEMO_MODE=false`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and **leave** `VITE_API_URL` unset for same-origin API.

Server variables: `DEMO_MODE=false`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN=https://<your-vercel-domain>`, `UYUMSOFT_BASE_URL`, `UYUMSOFT_USERNAME`, `UYUMSOFT_PASSWORD`, `UYUMSOFT_COCODE`, `UYUMSOFT_BRANCHCODE`, `UYUMSOFT_WHOUSECODE`, `UYUMSOFT_ENABLE_READS=false` until verified.

Assign secrets only to appropriate Vercel environments. `SUPABASE_SERVICE_ROLE_KEY` and Uyumsoft credentials must remain **server only**; never use a `VITE_` prefix for them. Vite public variables are embedded in browser assets at build time. Keep the existing two Supabase projects separate.

Production API startup explicitly rejects `DEMO_MODE=true`. Disable the frontend demo separately: `VITE_DEMO_MODE=false`.

## Check before release

1. `npm install && npm test && npm run build` from repository root.
2. For a preview, verify `/api/health` returns JSON, `/api/me` rejects requests without a bearer token, and `/nonexistent-spa-path` renders the SPA. Avoid sharing health responses publicly if configuration metadata is sensitive.
3. Verify login, request creation, status changes, logs, Supabase authentication and Uyumsoft read-only calls with non-production test credentials.
4. Confirm that the app never returns sample data as actual inventory. Verify CORS for the chosen preview/production URLs.
5. Only release with explicit approval and reviewed CI results. This change does **not** deploy production.

## Platform caveats

- Express is imported as a Vercel Function rather than bound to a TCP listening port. Local `npm run dev` and `npm start` still start port 4000.
- In-memory demo request/event arrays are not persistent across function invocations; for meaningful tests use local demo or a dedicated Supabase test project.
- Uyumsoft may require outbound IP allowlisting. Serverless outbound addresses are not guaranteed static without appropriate networking configuration. Check vendor restrictions before enabling writes or production reads.
- Vercel Git integration may automatically create **preview** deployments when the branch is pushed, if already connected. No CLI deploy/promote commands were run by this change.
