INSERT INTO categories (slug, name, display_order) VALUES
    ('ca-phe-hat-demo', 'Cà phê hạt', 1),
    ('ca-phe-bot-demo', 'Cà phê xay sẵn', 2)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order;

INSERT INTO origins (slug, name, region) VALUES
    ('da-lat-demo', 'Cao nguyên Đà Lạt', 'Đà Lạt, Lâm Đồng')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region;

INSERT INTO flavor_tags (slug, name) VALUES
    ('chocolate-demo', 'Chocolate'),
    ('cam-demo', 'Cam vàng'),
    ('hoa-demo', 'Hương hoa')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO products (origin_id, slug, name, description, acidity, body, sweetness, bitterness, aroma)
SELECT o.id, 'ca-phe-demo-01', 'Sương Mai Đà Lạt',
       'Hương chocolate, cam vàng và hậu vị ngọt dịu, phù hợp cho pha phin hoặc pour over.', 3, 3, 4, 2, 4
FROM origins o WHERE o.slug = 'da-lat-demo'
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, acidity = EXCLUDED.acidity, body = EXCLUDED.body, sweetness = EXCLUDED.sweetness, bitterness = EXCLUDED.bitterness, aroma = EXCLUDED.aroma;

INSERT INTO products (origin_id, slug, name, description, acidity, body, sweetness, bitterness, aroma)
SELECT o.id, 'ca-phe-demo-02', 'Sương Mai Hương Quả',
       'Nổi bật với hương cam vàng và hoa nhẹ, vị chua thanh cân bằng cùng hậu vị trong trẻo.', 4, 2, 3, 2, 5
FROM origins o WHERE o.slug = 'da-lat-demo'
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, acidity = EXCLUDED.acidity, body = EXCLUDED.body, sweetness = EXCLUDED.sweetness, bitterness = EXCLUDED.bitterness, aroma = EXCLUDED.aroma;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p CROSS JOIN categories c
WHERE (p.slug = 'ca-phe-demo-01' AND c.slug = 'ca-phe-hat-demo')
   OR (p.slug = 'ca-phe-demo-02' AND c.slug = 'ca-phe-bot-demo')
ON CONFLICT DO NOTHING;

INSERT INTO product_flavor_tags (product_id, flavor_tag_id)
SELECT p.id, t.id FROM products p CROSS JOIN flavor_tags t
WHERE (p.slug = 'ca-phe-demo-01' AND t.slug IN ('chocolate-demo', 'hoa-demo'))
   OR (p.slug = 'ca-phe-demo-02' AND t.slug IN ('cam-demo', 'hoa-demo'))
ON CONFLICT DO NOTHING;

INSERT INTO product_variants (product_id, sku, label, weight_g, price_vnd)
SELECT p.id, v.sku, v.label, v.weight_g, v.price_vnd
FROM products p
CROSS JOIN (VALUES
    ('SM-DEMO-01-250', '250g', 250, 185000::BIGINT),
    ('SM-DEMO-01-500', '500g', 500, 352000::BIGINT),
    ('SM-DEMO-02-250', '250g', 250, 195000::BIGINT)
) AS v(sku, label, weight_g, price_vnd)
WHERE (p.slug = 'ca-phe-demo-01' AND v.sku LIKE 'SM-DEMO-01-%')
   OR (p.slug = 'ca-phe-demo-02' AND v.sku = 'SM-DEMO-02-250')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO roast_batches (product_id, batch_code, roast_date)
SELECT p.id, 'DEMO-BATCH-01', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 5
FROM products p WHERE p.slug = 'ca-phe-demo-01'
ON CONFLICT (batch_code) DO UPDATE SET product_id = EXCLUDED.product_id, roast_date = EXCLUDED.roast_date;

INSERT INTO inventory_lots (product_id, variant_id, pool_kind, roast_batch_id, quantity_on_hand)
SELECT p.id, v.id, 'batch', b.id, 12
FROM products p
JOIN product_variants v ON v.product_id = p.id AND v.sku = 'SM-DEMO-01-250'
JOIN roast_batches b ON b.product_id = p.id AND b.batch_code = 'DEMO-BATCH-01'
WHERE p.slug = 'ca-phe-demo-01'
ON CONFLICT DO NOTHING;

INSERT INTO inventory_lots (product_id, variant_id, pool_kind, roast_batch_id, quantity_on_hand)
SELECT p.id, v.id, 'unbatched', NULL, 7
FROM products p
JOIN product_variants v ON v.product_id = p.id AND v.sku IN ('SM-DEMO-01-500', 'SM-DEMO-02-250')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_movements (inventory_lot_id, quantity_delta, movement_type, reason, seed_key)
SELECT id, quantity_on_hand, 'seed', 'Khởi tạo tồn kho', 'catalog-demo-lot-' || id
FROM inventory_lots
WHERE quantity_on_hand > 0
ON CONFLICT (seed_key) DO NOTHING;
