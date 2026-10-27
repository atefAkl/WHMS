<?php

/**
 * Targeted Update Packager for WHMS
 * Packages only the modified files from the latest fix with correct Unix permissions (644/755)
 */

$zip = new ZipArchive();
$baseDir = dirname(__DIR__);
$zipFile = $baseDir . '/WHMS_update_transfers_fix.zip';

if (file_exists($zipFile)) {
    unlink($zipFile);
}

echo "Packaging update patch...\n";

if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
    $dirs = [
        'app',
        'app/Http',
        'app/Http/Controllers',
        'app/Http/Controllers/Warehouse',
        'app/Traits'
    ];

    foreach ($dirs as $dir) {
        $zip->addEmptyDir($dir);
        $zip->setExternalAttributesName($dir, ZipArchive::OPSYS_UNIX, 0x41ED0000);
    }

    $files = [
        'app/Http/Controllers/Warehouse/ContractTransferController.php',
        'app/Traits/ValidatesSecureDeletion.php'
    ];

    foreach ($files as $relPath) {
        $fullPath = $baseDir . '/' . $relPath;
        if (file_exists($fullPath)) {
            $zip->addFile($fullPath, $relPath);
            $zip->setExternalAttributesName($relPath, ZipArchive::OPSYS_UNIX, 0x81A40000);
            echo "Added: {$relPath}\n";
        } else {
            echo "Warning: File not found: {$fullPath}\n";
        }
    }

    $zip->close();
    echo "Success! Created {$zipFile}\n";
} else {
    echo "Error: Could not create zip.\n";
}
