# Local Cloudflare D1 verification (opt-in)

This is an **offline/local-only** verification harness for the news schema and stale-approval audit correlation. It does not create a remote D1 database, deploy a Worker, call R2, or modify the AI Land Advisor.

## Run

Install a compatible Wrangler CLI in the `cloudflare` directory, then execute:

```sh
cd cloudflare
node scripts/local-d1-check.mjs
```

The script invokes only `wrangler d1 execute ... --local` using a temporary config and isolated temporary persistence directory. It uses synthetic records, checks that a successful review has one audit event, and checks that a stale duplicate cannot add an event. It deletes its temporary directory afterward.

**Important:** The script has not been executed against Wrangler yet. Local D1 testing does not prove multi-request production concurrency, Access authentication, or remote D1 behavior. Before deployment, run this check, inspect Wrangler's CLI output format, and add a real concurrent-request test using the supported local Worker/D1 runtime. Production database-writing routes remain disabled.
