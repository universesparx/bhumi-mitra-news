# Same-day integration candidate — not production-ready

`BhoAlertBiharScreen.tsx` is a self-contained Hindi React Native reader. It is **not** imported into the existing Bhumi Mitra project, and no existing module, filename, or navigation has been modified.

## Expected contract
Pass a reviewed HTTPS `feedUrl` prop. The endpoint must return a JSON array (maximum 50 entries) with: `id`, `headline_hi`, `summary_hi`, `source_name`, `source_url`, `source_publication_date`, `category`, `district`, `updated_at`. Only owner-reviewed, rights-checked, non-retracted items may appear. The Cloudflare feed storage query is implemented but **not exposed as an HTTP endpoint**.

## Deferred / blockers
- No production Cloudflare Access, owner identity, D1 binding, R2, or domain configured.
- No live cross-device editorial sync, authenticated editorial dashboard, or image upload/display.
- Source permissions and publication rights must be checked before using real content.
- Existing app integration requires the main project and explicit approval to change its files.
- Device rendering, TypeScript compilation in the real app, and full Worker-to-D1 integration remain unverified.
- No live publication, scraping, deployment, or automatic collection.

The current module is a **code candidate**, not a completed production feature. Use only synthetic data until all gates pass.
