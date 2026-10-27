<?php

/**
 * Direct Hotfix Applier & Verification for cPanel Hosting
 */

if (!headers_sent()) {
    header('Content-Type: text/html; charset=utf-8');
}

echo "<h2>WHMS Hotfix Verification & Applier</h2>";

$baseDir = dirname(__DIR__);
$controllerPath = $baseDir . '/app/Http/Controllers/Warehouse/ContractTransferController.php';
$traitPath = $baseDir . '/app/Traits/ValidatesSecureDeletion.php';

echo "<b>1. Checking Controller File:</b> " . htmlspecialchars($controllerPath) . "<br>";
if (file_exists($controllerPath)) {
    $content = file_get_contents($controllerPath);
    if (strpos($content, 'validateDeletePassword') !== false) {
        echo "<span style='color:orange;'>⚠ Found old method call 'validateDeletePassword' on disk. Replacing it now...</span><br>";
        $content = str_replace(
            '$this->validateDeletePassword($request);',
            '$this->validateSecureDelete($request);',
            $content
        );
        file_put_contents($controllerPath, $content);
        echo "<span style='color:green;'>✔ Successfully updated ContractTransferController.php on disk!</span><br>";
    } else {
        echo "<span style='color:green;'>✔ ContractTransferController.php is already updated! (Using validateSecureDelete)</span><br>";
    }
} else {
    echo "<span style='color:red;'>✖ Controller file not found!</span><br>";
}

echo "<hr><b>2. Checking Trait File:</b> " . htmlspecialchars($traitPath) . "<br>";
if (file_exists($traitPath)) {
    $traitContent = file_get_contents($traitPath);
    if (strpos($traitContent, 'validateDeletePassword') === false) {
        echo "<span style='color:orange;'>⚠ Adding missing validateDeletePassword alias to Trait...</span><br>";
        $aliasMethod = "\n    protected function validateDeletePassword(Request \$request)\n    {\n        \$this->validateSecureDelete(\$request);\n    }\n}\n";
        $traitContent = preg_replace('/\}\s*$/', $aliasMethod, $traitContent);
        file_put_contents($traitPath, $traitContent);
        echo "<span style='color:green;'>✔ Successfully added alias to ValidatesSecureDeletion.php!</span><br>";
    } else {
        echo "<span style='color:green;'>✔ ValidatesSecureDeletion.php already has validateDeletePassword alias!</span><br>";
    }
} else {
    echo "<span style='color:red;'>✖ Trait file not found!</span><br>";
}

echo "<hr><b>3. Clearing Caches & OPcache:</b><br>";
if (function_exists('opcache_reset')) {
    if (opcache_reset()) {
        echo "<span style='color:green;'>✔ PHP OPcache reset successfully!</span><br>";
    } else {
        echo "<span style='color:orange;'>⚠ OPcache reset returned false.</span><br>";
    }
} else {
    echo "<span>ℹ OPcache is not active or disabled.</span><br>";
}

try {
    if (file_exists($baseDir . '/vendor/autoload.php')) {
        require $baseDir . '/vendor/autoload.php';
        $app = require $baseDir . '/bootstrap/app.php';
        if (is_object($app) && method_exists($app, 'make')) {
            $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();
            \Illuminate\Support\Facades\Artisan::call('optimize:clear');
            echo "<pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre>";
        }
    }
} catch (\Throwable $e) {
    echo "<span style='color:gray;'>Artisan clear notice: " . $e->getMessage() . "</span><br>";
}

echo "<hr><h3 style='color:green;'>🎉 DONE! You can now try reopening the transfer receipt again.</h3>";
