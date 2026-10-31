-- Synthetic data only; executed on a fresh local D1 database.
INSERT INTO editorial_items (
  id, headline_hi, summary_hi, source_name, source_url,
  source_publication_date, category, district, created_at, updated_at,
  source_verified, rights_checked
) VALUES (
  'fixture-1','परीक्षण शीर्षक','परीक्षण विवरण','Synthetic',
  'https://example.org/fixture-1','2026-10-31','circular','Gaya',
  '2026-10-31','2026-10-31',1,1
);
UPDATE editorial_items
 SET status='approved', version=version+1,
 updated_at='2026-10-31', last_review_event_id='review-fixture-1'
 WHERE id='fixture-1' AND version=1 AND status='pending';
INSERT INTO review_events
 (id,item_id,action,reviewer_id,reason,occurred_at)
 SELECT 'review-fixture-1',id,'approve','synthetic-owner',
 'local fixture','2026-10-31'
 FROM editorial_items
 WHERE id='fixture-1' AND version=2 AND status='approved'
 AND last_review_event_id='review-fixture-1';
-- Stale repeat must not change article or add audit.
UPDATE editorial_items
 SET status='approved', version=version+1,
 updated_at='2026-10-31', last_review_event_id='review-fixture-2'
 WHERE id='fixture-1' AND version=1 AND status='pending';
INSERT INTO review_events
 (id,item_id,action,reviewer_id,reason,occurred_at)
 SELECT 'review-fixture-2',id,'approve','synthetic-owner',
 'stale duplicate','2026-10-31'
 FROM editorial_items
 WHERE id='fixture-1' AND version=2 AND status='approved'
 AND last_review_event_id='review-fixture-2';
