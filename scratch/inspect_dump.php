<?php

$files = glob("database/*.sql");
$files = array_merge($files, glob("*.sql"));

foreach ($files as $f) {
    echo "File: {$f} | Size: " . filesize($f) . " bytes\n";
    $content = file_get_contents($f);
    preg_match_all('/INSERT INTO "([^"]+)"/i', $content, $matches);
    if (!empty($matches[1])) {
        $counts = array_count_values($matches[1]);
        foreach ($counts as $tbl => $cnt) {
            echo "  - Table {$tbl}: {$cnt} rows\n";
        }
    } else {
        echo "  - No INSERT statements found!\n";
    }
}
