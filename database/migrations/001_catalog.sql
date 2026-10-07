CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE origins (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    region VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    origin_id BIGINT NOT NULL REFERENCES origins (id) ON DELETE RESTRICT,
    slug VARCHAR(160) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    acidity SMALLINT NOT NULL CHECK (acidity BETWEEN 1 AND 5),
    body SMALLINT NOT NULL CHECK (body BETWEEN 1 AND 5),
    sweetness SMALLINT NOT NULL CHECK (sweetness BETWEEN 1 AND 5),
    bitterness SMALLINT NOT NULL CHECK (bitterness BETWEEN 1 AND 5),
    aroma SMALLINT NOT NULL CHECK (aroma BETWEEN 1 AND 5),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_categories (
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    category_id BIGINT NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE flavor_tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE product_flavor_tags (
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    flavor_tag_id BIGINT NOT NULL REFERENCES flavor_tags (id) ON DELETE RESTRICT,
    PRIMARY KEY (product_id, flavor_tag_id)
);

CREATE TABLE product_variants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    sku VARCHAR(120) NOT NULL UNIQUE,
    label VARCHAR(80) NOT NULL,
    weight_g INTEGER NOT NULL CHECK (weight_g > 0),
    price_vnd BIGINT NOT NULL CHECK (price_vnd >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (id, product_id)
);

CREATE TABLE roast_batches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    batch_code VARCHAR(120) NOT NULL UNIQUE,
    roast_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, product_id)
);

CREATE TABLE inventory_lots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    variant_id BIGINT NOT NULL,
    pool_kind VARCHAR(20) NOT NULL CHECK (pool_kind IN ('batch', 'unbatched')),
    roast_batch_id BIGINT,
    quantity_on_hand INTEGER NOT NULL CHECK (quantity_on_hand >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    FOREIGN KEY (variant_id, product_id) REFERENCES product_variants (id, product_id) ON DELETE RESTRICT,
    FOREIGN KEY (roast_batch_id, product_id) REFERENCES roast_batches (id, product_id) ON DELETE RESTRICT,
    CHECK (
        (pool_kind = 'batch' AND roast_batch_id IS NOT NULL)
        OR (pool_kind = 'unbatched' AND roast_batch_id IS NULL)
    )
);

CREATE UNIQUE INDEX inventory_lots_batch_identity
    ON inventory_lots (variant_id, roast_batch_id)
    WHERE pool_kind = 'batch';

CREATE UNIQUE INDEX inventory_lots_unbatched_identity
    ON inventory_lots (variant_id)
    WHERE pool_kind = 'unbatched';

CREATE TABLE inventory_movements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inventory_lot_id BIGINT NOT NULL REFERENCES inventory_lots (id) ON DELETE RESTRICT,
    quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
    movement_type VARCHAR(40) NOT NULL,
    reason TEXT NOT NULL,
    seed_key VARCHAR(160) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX products_active_name_idx ON products (is_active, name, id);
CREATE INDEX products_origin_idx ON products (origin_id, is_active);
CREATE INDEX product_categories_category_idx ON product_categories (category_id, product_id);
CREATE INDEX product_variants_product_idx ON product_variants (product_id, is_active);
CREATE INDEX inventory_lots_variant_available_idx
    ON inventory_lots (variant_id, quantity_on_hand)
    WHERE quantity_on_hand > 0;
CREATE INDEX roast_batches_product_date_idx ON roast_batches (product_id, roast_date DESC);
