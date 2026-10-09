-- Development/staging catalog expansion. Do not run database/seed.php on production.
INSERT INTO categories (slug, name, display_order) VALUES
    ('espresso', 'Cà phê espresso', 3),
    ('pour-over', 'Cà phê pour over', 4),
    ('blend', 'Phối trộn đặc biệt', 5)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order;

INSERT INTO origins (slug, name, region) VALUES
    ('cau-dat-demo', 'Cầu Đất', 'Cầu Đất, Đà Lạt, Lâm Đồng'),
    ('son-la-demo', 'Sơn La', 'Sơn La, Tây Bắc'),
    ('buon-ma-thuot-demo', 'Buôn Ma Thuột', 'Đắk Lắk, Tây Nguyên'),
    ('ethiopia-demo', 'Yirgacheffe', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Ethiopia'),
    ('kenya-demo', 'Nyeri', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Kenya')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region;

INSERT INTO flavor_tags (slug, name) VALUES
    ('hat-phong-demo', 'Hạt phỉ'),
    ('caramel-demo', 'Caramel'),
    ('mat-ong-demo', 'Mật ong'),
    ('viet-quat-demo', 'Việt quất'),
    ('tra-den-demo', 'Trà đen'),
    ('nhai-demo', 'Hoa nhài')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO products (origin_id, slug, name, description, acidity, body, sweetness, bitterness, aroma)
SELECT o.id, v.slug, v.name, v.description, v.acidity, v.body, v.sweetness, v.bitterness, v.aroma
FROM origins o
JOIN (VALUES
    ('cau-dat-demo', 'cau-dat-honey-demo', 'Cầu Đất Honey — Mật ong & cam', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Cà phê demo vị mật ong, cam vàng và hậu ngọt.', 3, 3, 5, 2, 4),
    ('son-la-demo', 'son-la-hoa-qua-demo', 'Sơn La — Mơ chín & trà đen', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Cà phê demo với vị quả chín, trà đen và độ chua thanh.', 4, 2, 4, 1, 5),
    ('buon-ma-thuot-demo', 'dak-lak-dam-demo', 'Đắk Lắk — Chocolate đậm', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Cà phê demo đậm vị chocolate và hạt rang.', 2, 5, 3, 4, 3),
    ('ethiopia-demo', 'yirgacheffe-floral-demo', 'Yirgacheffe — Hoa nhài & đào', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Origin quốc tế demo; cần xác minh nguồn trước khi dùng thương mại.', 5, 2, 4, 1, 5),
    ('kenya-demo', 'nyeri-berry-demo', 'Nyeri — Việt quất & cam', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Origin quốc tế demo; cần xác minh nguồn trước khi dùng thương mại.', 5, 3, 4, 2, 5),
    ('cau-dat-demo', 'cau-dat-espresso-demo', 'Cầu Đất Espresso — Caramel', 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC. Blend demo cho espresso, chocolate sữa và caramel.', 3, 4, 4, 3, 4)
) AS v(origin_slug, slug, name, description, acidity, body, sweetness, bitterness, aroma) ON v.origin_slug = o.slug
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, acidity = EXCLUDED.acidity, body = EXCLUDED.body, sweetness = EXCLUDED.sweetness, bitterness = EXCLUDED.bitterness, aroma = EXCLUDED.aroma;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p JOIN categories c ON c.slug = CASE
    WHEN p.slug LIKE '%espresso%' THEN 'espresso'
    ELSE 'pour-over'
END
WHERE p.slug IN ('cau-dat-honey-demo', 'son-la-hoa-qua-demo', 'dak-lak-dam-demo', 'yirgacheffe-floral-demo', 'nyeri-berry-demo', 'cau-dat-espresso-demo')
ON CONFLICT DO NOTHING;

INSERT INTO product_flavor_tags (product_id, flavor_tag_id)
SELECT p.id, t.id FROM products p JOIN flavor_tags t ON t.slug = CASE p.slug
    WHEN 'cau-dat-honey-demo' THEN 'mat-ong-demo'
    WHEN 'son-la-hoa-qua-demo' THEN 'tra-den-demo'
    WHEN 'dak-lak-dam-demo' THEN 'hat-phong-demo'
    WHEN 'yirgacheffe-floral-demo' THEN 'nhai-demo'
    WHEN 'nyeri-berry-demo' THEN 'viet-quat-demo'
    WHEN 'cau-dat-espresso-demo' THEN 'caramel-demo'
END
WHERE p.slug IN ('cau-dat-honey-demo', 'son-la-hoa-qua-demo', 'dak-lak-dam-demo', 'yirgacheffe-floral-demo', 'nyeri-berry-demo', 'cau-dat-espresso-demo')
ON CONFLICT DO NOTHING;

INSERT INTO product_variants (product_id, sku, label, weight_g, price_vnd)
SELECT p.id, sku, label, weight_g, price_vnd
FROM products p
CROSS JOIN (VALUES ('250g', 250, 205000::BIGINT), ('500g', 500, 388000::BIGINT)) AS v(label, weight_g, price_vnd)
CROSS JOIN LATERAL (SELECT upper(replace(p.slug, '-', '_')) || '_' || v.weight_g::text AS sku) AS s
WHERE p.slug IN ('cau-dat-honey-demo', 'son-la-hoa-qua-demo', 'dak-lak-dam-demo', 'yirgacheffe-floral-demo', 'nyeri-berry-demo', 'cau-dat-espresso-demo')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO inventory_lots (product_id, variant_id, pool_kind, roast_batch_id, quantity_on_hand)
SELECT p.id, v.id, 'unbatched', NULL, 12
FROM products p JOIN product_variants v ON v.product_id = p.id
WHERE p.slug IN ('cau-dat-honey-demo', 'son-la-hoa-qua-demo', 'dak-lak-dam-demo', 'yirgacheffe-floral-demo', 'nyeri-berry-demo', 'cau-dat-espresso-demo')
ON CONFLICT DO NOTHING;
