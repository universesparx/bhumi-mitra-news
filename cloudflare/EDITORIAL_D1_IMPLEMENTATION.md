# D1 editorial persistence prototype

The new `editorial-store.js` is a database adapter, not a live API. It supports manually prepared pending drafts and review transitions with owner identity, optimistic version checks and review events. It does **not** collect, upload images, publish, or deploy.

**Important before production:** D1 batch transactions are used for grouped statements, but the review path needs explicit verification that a zero-row optimistic update cannot leave an audit event or an incorrect success result under concurrent requests. Review the exact D1 batch failure and concurrency semantics, then implement a fail-closed conditional audit or a transaction-safe strategy and test against real local D1. Add comprehensive validation, source URL canonicalization, stable idempotency keys, timestamps, immutable reviewer identity from verified Access claims, image-rights evidence, and error mapping. No production route may call this adapter until these checks pass.

The current database schema and Worker remain non-deployed. AI Land Advisor is unchanged.
