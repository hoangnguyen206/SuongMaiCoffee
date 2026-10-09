CREATE TABLE IF NOT EXISTS grind_options (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    coupon_type VARCHAR(16) NOT NULL CHECK (coupon_type IN ('percent', 'fixed')),
    percent_value INTEGER CHECK (percent_value BETWEEN 1 AND 100),
    fixed_value_vnd BIGINT CHECK (fixed_value_vnd >= 0),
    minimum_subtotal_vnd BIGINT NOT NULL DEFAULT 0 CHECK (minimum_subtotal_vnd >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMPTZ,
    CHECK ((coupon_type = 'percent' AND percent_value IS NOT NULL AND fixed_value_vnd IS NULL)
        OR (coupon_type = 'fixed' AND fixed_value_vnd IS NOT NULL AND percent_value IS NULL))
);

CREATE TABLE IF NOT EXISTS coupon_categories (
    coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    PRIMARY KEY (coupon_id, category_id)
);

CREATE TABLE IF NOT EXISTS carts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    guest_key_hash CHAR(64),
    coupon_id BIGINT REFERENCES coupons(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((user_id IS NOT NULL AND guest_key_hash IS NULL) OR (user_id IS NULL AND guest_key_hash IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS carts_user_identity_idx ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS carts_guest_identity_idx ON carts(guest_key_hash) WHERE guest_key_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    grind_option_id BIGINT NOT NULL REFERENCES grind_options(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, variant_id, grind_option_id)
);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON cart_items(cart_id, id);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_code VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    recipient_name VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(254),
    address_line1 VARCHAR(240) NOT NULL,
    address_line2 VARCHAR(240),
    province_city VARCHAR(120) NOT NULL,
    district VARCHAR(120) NOT NULL,
    ward VARCHAR(120),
    shipping_method VARCHAR(20) NOT NULL CHECK (shipping_method IN ('standard', 'pickup')),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cod', 'bank')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'roasting', 'shipping', 'completed', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    coupon_id BIGINT REFERENCES coupons(id) ON DELETE RESTRICT,
    subtotal_vnd BIGINT NOT NULL CHECK (subtotal_vnd >= 0),
    discount_vnd BIGINT NOT NULL DEFAULT 0 CHECK (discount_vnd >= 0),
    shipping_vnd BIGINT NOT NULL DEFAULT 0 CHECK (shipping_vnd >= 0),
    grand_total_vnd BIGINT NOT NULL CHECK (grand_total_vnd >= 0),
    idempotency_key_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE RESTRICT,
    grind_option_id BIGINT REFERENCES grind_options(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,
    variant_label VARCHAR(80) NOT NULL,
    grind_label VARCHAR(120) NOT NULL,
    unit_price_vnd BIGINT NOT NULL CHECK (unit_price_vnd >= 0),
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    line_total_vnd BIGINT NOT NULL CHECK (line_total_vnd >= 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id, id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    note TEXT,
    changed_by_user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history(order_id, created_at, id);

CREATE TABLE IF NOT EXISTS order_inventory_allocations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    inventory_lot_id BIGINT NOT NULL REFERENCES inventory_lots(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reversed_at TIMESTAMPTZ,
    UNIQUE (order_item_id, inventory_lot_id)
);
CREATE INDEX IF NOT EXISTS order_allocations_order_idx ON order_inventory_allocations(order_id);

CREATE TABLE IF NOT EXISTS admin_inventory_adjustments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inventory_lot_id BIGINT NOT NULL REFERENCES inventory_lots(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
    note VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
