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

INSERT INTO users (full_name, email_normalized, phone, password_hash, role)
VALUES
    ('Quản trị Sương Mai', 'admin@suongmai.local', '+84900000001', '$2y$10$1qRzVQJPmI/O/qysbLL2AuCP1NoNA/FmhLcQdf6KVK/w3s1VINbpK', 'admin'),
    ('Khách hàng Sương Mai', 'customer@suongmai.local', '+84900000002', '$2y$10$/H7Ppr9C11NdKb71QEs0OORdiIY81K4kn01tCdZcqM49Np.8kaPb6', 'customer')
ON CONFLICT (email_normalized) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;
