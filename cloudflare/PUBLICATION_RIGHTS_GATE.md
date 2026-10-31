# Publication rights gate — backend security note

Public news retrieval is disabled unless `NEWS_PUBLISHING_ENABLED=true` and a dedicated `NEWS_DB` binding are explicitly configured. This repository does **not** enable those settings or deploy the Worker.

Both current approved-feed query adapters additionally require:

1. Status `approved`, not retracted.
2. Source verification and rights-check flags set on the item.
3. A matching `rights_evidence` database row containing a nonempty permission reference and scope.

**Important:** A nonempty evidence row is only a technical guard, not proof that the permission is valid. There is currently no owner-only rights-evidence verification workflow, trusted approval authority, expiration checking, or live source-permission verification. Synthetic fixture evidence is never authorization for real publication. Production publication remains blocked pending legal and editorial review.

The existing `/api/news` route returns a JSON array for the isolated React Native reader. `feed-pagination.js` is not yet connected to an HTTP route. The source-rights audit and correction/retraction workflows must be completed before live launch.
