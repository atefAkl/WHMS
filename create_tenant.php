<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
Illuminate\Support\Facades\Facade::setFacadeApplication($app);

use App\Models\Tenant;

$domain1 = 'www.whms.loc';
$domain2 = 'whms.loc';

try {
    if (Tenant::where('id', 'whms')->exists()) {
        echo "Tenant 'whms' already exists.\n";
        $tenant = Tenant::find('whms');
    } else {
        $tenant = Tenant::create(['id' => 'whms']);
        echo "Created tenant 'whms'.\n";
    }

    $existing = $tenant->domains()->pluck('domain')->toArray();
    foreach ([$domain1, $domain2] as $d) {
        if (!in_array($d, $existing)) {
            $tenant->domains()->create(['domain' => $d]);
            echo "Added domain $d to tenant.\n";
        } else {
            echo "Domain $d already assigned.\n";
        }
    }
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
