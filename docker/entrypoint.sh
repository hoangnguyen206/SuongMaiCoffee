#!/bin/sh
set -eu

port="${PORT:-80}"
if [ "$port" != "80" ]; then
  sed -ri "s/Listen 80/Listen ${port}/g" /etc/apache2/ports.conf
  sed -ri "s/<VirtualHost \\*:80>/<VirtualHost *:${port}>/g" /etc/apache2/sites-available/000-default.conf
fi

if [ "${APP_ENV:-production}" = "production" ] && [ "${SEED_DEMO_DATA:-0}" = "true" ]; then
  php database/migrate.php
  php database/seed.php
  if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_NAME:-}" ] && [ -n "${ADMIN_PHONE:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
    php database/provision_admin.php
  fi
fi

exec apache2-foreground
