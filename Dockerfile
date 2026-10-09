FROM php:8.4-apache-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && printf '\n<Directory ${APACHE_DOCUMENT_ROOT}>\n    AllowOverride All\n    Require all granted\n</Directory>\n' >> /etc/apache2/apache2.conf

WORKDIR /var/www/html
COPY . /var/www/html
COPY docker/entrypoint.sh /usr/local/bin/suongmai-entrypoint
RUN chmod +x /usr/local/bin/suongmai-entrypoint

ENV PORT=80
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/suongmai-entrypoint"]
