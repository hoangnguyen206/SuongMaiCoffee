INSERT INTO grind_options (slug, name) VALUES
    ('whole-bean', 'Hạt nguyên'),
    ('phin', 'Xay phin'),
    ('espresso', 'Xay espresso')
ON CONFLICT (slug) DO NOTHING;

UPDATE coupons SET code = 'SOMAI50000' WHERE code = 'DEMO50000' AND NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SOMAI50000');

INSERT INTO coupons (code, coupon_type, percent_value, fixed_value_vnd, minimum_subtotal_vnd)
VALUES
    ('WELCOME10', 'percent', 10, NULL, 0),
    ('SOMAI50000', 'fixed', NULL, 50000, 150000)
ON CONFLICT (code) DO NOTHING;
