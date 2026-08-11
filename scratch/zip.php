<?php

/**
 * WHMS Production Packager
 * Packages the Laravel project with correct Unix permission attributes (644 for files, 755 for directories)
 * to avoid 403 Forbidden errors when extracting on cPanel hosting.
 */

$zip = new ZipArchive();
$baseDir = dirname(__DIR__);
$zipFile = $baseDir . '/WHMS_release.zip';

if (file_exists($zipFile)) {
    unlink($zipFile);
}

echo "Starting packaging process...\n";

if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $fileCount = 0;
    $dirCount = 0;

    foreach ($files as $name => $file) {
        $filePath = $file->getRealPath();
        $relativePath = substr($filePath, strlen($baseDir) + 1);
        $relativePath = str_replace('\\', '/', $relativePath);

        // Exclude rules
        if (
            strpos($relativePath, 'node_modules') === 0 ||
            strpos($relativePath, 'vendor') === 0 ||
            strpos($relativePath, 'public/uploads') === 0 ||
            strpos($relativePath, '.git') === 0 ||
            strpos($relativePath, 'WHMS_release.zip') === 0 ||
            strpos($relativePath, '.env') !== false ||
            strpos($relativePath, 'scratch') === 0 ||
            strpos($relativePath, 'storage/logs/') !== false ||
            strpos($relativePath, 'storage/framework/views/') !== false ||
            strpos($relativePath, 'storage/framework/cache/data/') !== false ||
            strpos($relativePath, 'bootstrap/cache/') !== false
        ) {
            continue;
        }

        if ($file->isDir()) {
            $zip->addEmptyDir($relativePath);
            // 040755 in octal = 0x41ED0000 in external attributes hex (directory)
            $zip->setExternalAttributesName($relativePath, ZipArchive::OPSYS_UNIX, 0x41ED0000);
            $dirCount++;
        } else {
            $zip->addFile($filePath, $relativePath);
            // 0100644 in octal = 0x81A40000 in external attributes hex (regular file)
            $zip->setExternalAttributesName($relativePath, ZipArchive::OPSYS_UNIX, 0x81A40000);
            $fileCount++;
        }
    }
    
    // Explicitly add and secure required empty folders for Laravel structure
    $requiredEmptyDirs = [
        'storage/logs',
        'storage/framework/views',
        'storage/framework/cache/data',
        'storage/framework/sessions',
        'bootstrap/cache'
    ];

    foreach ($requiredEmptyDirs as $dirPath) {
        $zip->addEmptyDir($dirPath);
        $zip->setExternalAttributesName($dirPath, ZipArchive::OPSYS_UNIX, 0x41ED0000);
        $dirCount++;
    }
    
    $zip->close();
    echo "Success! Packed {$fileCount} files and {$dirCount} directories into WHMS_release.zip.\n";
    echo "All files are stamped with 644 permissions, and directories with 755 permissions.\n";
} else {
    echo "Error: Failed to open ZIP archive for writing.\n";
}
