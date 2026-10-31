# भू-अलर्ट बिहार — Offline UI demonstration

Open `review-demo.html` directly in a browser. It has no external scripts, network requests, backend, storage, scraping or publication. All sample items are fictional. Approve/reject choices last only until page reload. The `example.org` links are fictional placeholders and are not fetched by the application.

This interface is **not** an authenticated production moderation system. Do not paste confidential drafts or real personal information into a public GitHub repository. Existing Bhumi Mitra React Native app files are not touched.

## Acceptance checks

1. Both examples start pending.
2. Approving one item shows it only in approved preview.
3. Rejecting an item never puts it in approved preview.
4. Reset returns both to pending.
5. Reload clears all choices.
6. Inspect that the file contains no fetch, XMLHttpRequest, external script, localStorage, or publishing endpoints.
