<?php

$files = [
    'C:\laragon\www\WHMS\app\Http\Controllers\Accounting\JournalEntryController.php',
    'C:\laragon\www\WHMS\app\Http\Controllers\Accounting\SalesInvoiceController.php'
];

foreach ($files as $path) {
    if (file_exists($path)) {
        $content = file_get_contents($path);
        
        $target = "JournalEntry::whereMonth('date', \$month)";
        $replacement = "JournalEntry::withTrashed()->whereMonth('date', \$month)";
        
        $content = str_replace($target, $replacement, $content);
        file_put_contents($path, $content);
        echo basename($path) . " fixed.\n";
    }
}
