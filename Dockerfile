# Stage 1: Build Vite assets
FROM node:22-alpine AS assets

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Final PHP + Nginx + Supervisor runtime
FROM php:8.2-fpm-alpine

WORKDIR /app

# Install system utilities, runtime dependencies, nginx, and supervisor
RUN apk add --no-cache \
    curl \
    git \
    nginx \
    supervisor \
    unzip \
    zip \
    bash

# Download the helper script to easily install PHP extensions
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

# Install and configure all required PHP extensions (automatically compiled and optimized)
RUN install-php-extensions gd bcmath mbstring pdo_mysql pdo_sqlite xml zip redis pdo_pgsql pgsql

# Copy Composer from official image
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

# Copy configuration files
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy application source code
COPY --chown=www-data:www-data . .

# Copy Vite-compiled frontend assets from Stage 1
COPY --chown=www-data:www-data --from=assets /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set up storage and cache permissions
RUN mkdir -p storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Generate environment file if missing
RUN if [ ! -f .env ]; then cp .env.example .env; fi

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
