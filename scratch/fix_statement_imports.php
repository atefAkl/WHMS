<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Customers\Statement.jsx';
$content = file_get_contents($path);

// Fix the import
$target = 'import { useTranslation } from "@/Contexts/TranslationContext";';
$replacement = 'import { useLang } from "@/Contexts/LanguageContext";';
$content = str_replace($target, $replacement, $content);

// Fix the usage
$targetUse = 'const { t, lang } = useTranslation();';
$replacementUse = "const { lang } = useLang();\n    const t = (key, replacements = {}) => __(key, replacements);";
$content = str_replace($targetUse, $replacementUse, $content);

file_put_contents($path, $content);
echo "Statement.jsx fixed.";
