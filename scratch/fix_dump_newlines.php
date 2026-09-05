<?php

$inputFile = 'database/tenant_thalaga_dump.sql';
$outputFile = 'database/tenant_thalaga_dump_fixed.sql';

if (!file_exists($inputFile)) {
    die("File not found\n");
}

echo "Fixing multiline SQL statements in {$inputFile}...\n";
$content = file_get_contents($inputFile);

// Replace raw multiline breaks inside SQL INSERT statements
$fixed = preg_replace_callback('/INSERT INTO "[^"]+" \([^)]+\) VALUES \([^;]+\);/s', function($match) {
    $stmt = $match[0];
    // Replace raw newlines inside string literals
    return preg_replace_callback("/'([^']*)'/s", function($m) {
        $str = $m[1];
        $str = str_replace(["\r\n", "\r", "\n"], "\\n", $str);
        return "'" . $str . "'";
    }, $stmt);
}, $content);

// Prepend session_replication_role = 'replica';
$finalSql = "SET session_replication_role = 'replica';\n\n" . $fixed . "\n\nSET session_replication_role = 'origin';\n";

file_put_contents($outputFile, $finalSql);
echo "Fixed dump saved to {$outputFile}! Size: " . strlen($finalSql) . " bytes\n";
