<?php

/**
 * Targeted Update Packager for WHMS
 * Packages the modified files and compiled build assets with correct Unix permissions (644/755)
 */

$zip = new ZipArchive();
$baseDir = dirname(__DIR__);
$zipFile = $baseDir . '/WHMS_update_transfers_fix.zip';

if (file_exists($zipFile)) {
    unlink($zipFile);
}

echo "Packaging update patch: {$zipFile}...\n";

if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
    // 1. Explicitly list individual changed code files
    $codeFiles = [
        'app/Http/Controllers/Warehouse/ContractTransferController.php',
        'app/Traits/ValidatesSecureDeletion.php',
        'resources/js/Pages/Warehouse/Transfers/Index.jsx',
        'resources/js/Pages/Warehouse/Transfers/CreateEdit.jsx',
    ];

    $addedDirs = [];

    $ensureDir = function ($dirPath) use ($zip, &$addedDirs) {
        $parts = explode('/', trim(str_replace('\\', '/', $dirPath), '/'));
        $current = '';
        foreach ($parts as $part) {
            $current = $current === '' ? $part : $current . '/' . $part;
            if (!isset($addedDirs[$current])) {
                $zip->addEmptyDir($current);
                $zip->setExternalAttributesName($current, ZipArchive::OPSYS_UNIX, 0x41ED0000); // 755
                $addedDirs[$current] = true;
            }
        }
    };

    foreach ($codeFiles as $relPath) {
        $fullPath = $baseDir . '/' . $relPath;
        if (file_exists($fullPath)) {
            $dir = dirname($relPath);
            $ensureDir($dir);
            $zip->addFile($fullPath, $relPath);
            $zip->setExternalAttributesName($relPath, ZipArchive::OPSYS_UNIX, 0x81A40000); // 644
            echo "Added code file: {$relPath}\n";
        } else {
            echo "Warning: File not found: {$fullPath}\n";
        }
    }

    // 2. Add public/build files (compiled assets)
    $buildDir = $baseDir . '/public/build';
    if (is_dir($buildDir)) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($buildDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($files as $file) {
            $filePath = $file->getRealPath();
            $rel = substr($filePath, strlen($baseDir) + 1);
            $rel = str_replace('\\', '/', $rel);

            if ($file->isDir()) {
                $ensureDir($rel);
            } else {
                $ensureDir(dirname($rel));
                $zip->addFile($filePath, $rel);
                $zip->setExternalAttributesName($rel, ZipArchive::OPSYS_UNIX, 0x81A40000); // 644
            }
        }
        echo "Added public/build assets successfully.\n";
    }

    $zip->close();
    echo "Success! Created {$zipFile}\n";
} else {
    echo "Error: Could not create zip.\n";
}

