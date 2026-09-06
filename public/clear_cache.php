<?php

/**
 * Direct Cache Cleaner for cPanel Hosting
 * Clears cached route, config, and package files in bootstrap/cache/
 */

$baseDir = dirname(__DIR__);

$cacheFiles = [
    $baseDir . '/bootstrap/cache/routes-v7.php',
    $baseDir . '/bootstrap/cache/routes.php',
    $baseDir . '/bootstrap/cache/config.php',
    $baseDir . '/bootstrap/cache/services.php',
    $baseDir . '/bootstrap/cache/packages.php',
];

$deleted = [];
foreach ($cacheFiles as $file) {
    if (file_exists($file)) {
        @unlink($file);
        $deleted[] = basename($file);
    }
}

// Clear views cache
$viewFiles = glob($baseDir . '/storage/framework/views/*.php');
if ($viewFiles) {
    foreach ($viewFiles as $v) {
        @unlink($v);
    }
    $deleted[] = count($viewFiles) . " view cache files";
}

header('Content-Type: text/plain; charset=utf-8');
echo "=========================================================\n";
echo "       LARAVEL CACHE CLEARED SUCCESSFULLY                \n";
echo "=========================================================\n";
echo "Cleared items: " . (!empty($deleted) ? implode(', ', $deleted) : "Already clean") . "\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n";
echo "=========================================================\n";
