ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
UPDATE orders SET status = 'roasting' WHERE status = 'processing';
UPDATE orders SET status = 'shipping' WHERE status = 'shipped';
UPDATE order_status_history SET to_status = 'roasting' WHERE to_status = 'processing';
UPDATE order_status_history SET to_status = 'shipping' WHERE to_status = 'shipped';
UPDATE order_status_history SET from_status = 'roasting' WHERE from_status = 'processing';
UPDATE order_status_history SET from_status = 'shipping' WHERE from_status = 'shipped';
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'roasting', 'shipping', 'completed', 'cancelled'));

CREATE TABLE IF NOT EXISTS guest_lookup_attempts (
    ip_digest CHAR(64) PRIMARY KEY,
    window_started_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL CHECK (attempt_count BETWEEN 1 AND 5),
    blocked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS guest_lookup_attempts_blocked_idx
    ON guest_lookup_attempts (blocked_until);
