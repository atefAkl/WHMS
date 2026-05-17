<?php

use App\Models\Tenant;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $tenant = Tenant::create(['id' => 'admin']);
    $tenant->domains()->create(['domain' => 'admin.localhost']);
    
    echo "Tenant created successfully!\nID: admin\nDomain: admin.localhost\n";
    echo "Now running migrations for this tenant...\n";
    
    \Illuminate\Support\Facades\Artisan::call('tenants:migrate', ['--tenant' => 'admin']);
    echo \Illuminate\Support\Facades\Artisan::output();
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
