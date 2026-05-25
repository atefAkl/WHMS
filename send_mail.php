<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Ensure facades work
Illuminate\Support\Facades\Facade::setFacadeApplication($app);

try {
    $mailer = $app->make('mailer');
    $mailer->raw('Hello Yosra, your account is confirmed.', function ($m) {
        $m->to('yosra@mawthiq.tech')->subject('Account Confirmation');
    });
    echo "Mail sent\n";
} catch (Throwable $e) {
    echo "Mail error: " . $e->getMessage() . "\n";
    exit(1);
}
