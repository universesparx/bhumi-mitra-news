# R2 image and editorial review safeguards

**Offline prototype only.** No R2 bucket, upload route, publication route, or cloud resource exists.

## Images

The `image-policy.js` validator accepts candidate JPEG/PNG/WebP files up to 2 MiB only when image rights are confirmed and file header bytes match the claimed type. This is a **preliminary filter**, not a complete image security check. Before any real R2 upload, implement full image decoding/re-encoding, dimension and decompression limits, metadata stripping, content provenance, malware considerations, private original storage, and owner-only upload authorization. Never trust the browser's MIME or rights checkbox alone. The uploaded file must be tied to a specific reviewed article and permission evidence.

## Editorial decisions

The `review-policy.js` rules require owner authorization, verified source, checked content rights, and separately checked image rights before approval. Corrections return an item to pending; retractions remove it from the approved state. Production must enforce transitions atomically in D1, persist immutable review events, prevent race conditions, and rebuild/invalidate any public cache when an item is retracted.

These functions are not connected to deployed endpoints. Source collection and publication remain disabled.
