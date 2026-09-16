<?php

/**
 * Direct Standalone Migration Deployer for cPanel Hosting
 * Bypasses domain scoping and route caching.
 */

try {
    if (!function_exists('app') || !app()) {
        require dirname(__DIR__) . '/vendor/autoload.php';
        $app = require dirname(__DIR__) . '/bootstrap/app.php';
        if (is_object($app) && method_exists($app, 'make')) {
            $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();
        }
    }
} catch (\Throwable $e) {
    // If already booted in web request lifecycle, continue
}

if (!headers_sent()) {
    header('Content-Type: text/html; charset=utf-8');
}
echo "<h2>WHMS Database Migration Deployer</h2>";

try {
    echo "<b>Running Central Migrations...</b><br>";
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "<pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre><hr>";

    echo "<b>Running Tenant Migrations...</b><br>";
    \Illuminate\Support\Facades\Artisan::call('tenants:migrate', ['--force' => true]);
    echo "<pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre><hr>";

    echo "<h3 style='color: green;'>✔ ALL MIGRATIONS & BACKFILL COMPLETED SUCCESSFULLY!</h3>";
} catch (\Throwable $e) {
    echo "<h3 style='color: red;'>✖ Migration Error: " . $e->getMessage() . "</h3>";
}
