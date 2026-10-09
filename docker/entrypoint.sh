#!/bin/sh
set -eu

port="${PORT:-80}"
if [ "$port" != "80" ]; then
  sed -ri "s/Listen 80/Listen ${port}/g" /etc/apache2/ports.conf
  sed -ri "s/<VirtualHost \\*:80>/<VirtualHost *:${port}>/g" /etc/apache2/sites-available/000-default.conf
fi

exec apache2-foreground
