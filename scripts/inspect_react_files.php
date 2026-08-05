<?php
$files = [
    'C:\laragon\www\WHMS\resources\js\Pages\Warehouse\Receptions\CreateEdit.jsx',
    'C:\laragon\www\WHMS\resources\js\Pages\Warehouse\Deliveries\CreateEdit.jsx',
    'C:\laragon\www\WHMS\resources\js\Pages\Warehouse\ExitAuthorizations\CreateEdit.jsx'
];

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "File not found: $file\n";
        continue;
    }
    echo "=== File: $file ===\n";
    $content = file_get_contents($file);
    // Let's find useEffect blocks that have contract_id or availableContracts or fetch occupancy stats
    $lines = file($file);
    foreach ($lines as $num => $line) {
        if (str_contains($line, 'occupancy-stats') || str_contains($line, 'useEffect') || str_contains($line, 'contractStats') || str_contains($line, 'liveRemaining')) {
            echo ($num + 1) . ": " . trim($line) . "\n";
        }
    }
}
