-- Additive catalog content expansion for classroom/demo data.
-- All records remain inactive until explicitly used by the catalog seed/admin UI.
CREATE TABLE IF NOT EXISTS store_content (
    content_key VARCHAR(80) PRIMARY KEY,
    content_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS flavor_tags_active_name_idx ON flavor_tags (is_active, name, id);
