/*
  Canonical convention throughout the app:
  stress_score 1 = low perceived stress, 5 = high perceived stress.

  Contemplative check-ins were previously collected with the opposite label,
  so existing values in that table must be inverted once.
*/

UPDATE contemplative_checkins
SET stress_score = 6 - stress_score
WHERE stress_score IS NOT NULL;

COMMENT ON COLUMN contemplative_checkins.stress_score IS
  'Perceived stress: 1 = low, 5 = high.';

COMMENT ON COLUMN daily_checkins.stress_score IS
  'Perceived stress: 1 = low, 5 = high.';
