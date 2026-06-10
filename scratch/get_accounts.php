<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\Account;

tenancy()->initialize(Tenant::first());

$accounts = Account::where('is_transactional', true)->get(['id', 'code', 'name_ar']);
foreach($accounts as $acc) {
    echo $acc->code . ' - ' . $acc->name_ar . "\n";
}
