BEGIN;

ALTER TYPE bet_status_enum ADD VALUE IF NOT EXISTS 'win';
ALTER TYPE bet_status_enum ADD VALUE IF NOT EXISTS 'loss';
ALTER TYPE bet_status_enum ADD VALUE IF NOT EXISTS 'refund';

COMMIT;

