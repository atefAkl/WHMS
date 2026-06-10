<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Customers\Index.jsx';
$content = file_get_contents($path);

// 1. Add accounts to props
$propsTarget = <<<'EOF'
export default function Index({
    auth,
    customers,
    filters,
    countries = [],
    categories = [],
    stats = {},
}) {
EOF;
$propsReplacement = <<<'EOF'
export default function Index({
    auth,
    customers,
    filters,
    countries = [],
    categories = [],
    accounts = [],
    stats = {},
}) {
EOF;
$content = str_replace($propsTarget, $propsReplacement, $content);

// 2. Add account_id to useForm
$useFormTarget = <<<'EOF'
        country_id: countries.length > 0 ? countries[0].id : 1,
        parent_category_id: "",
        category_id: "",
        password: "",
    });
EOF;
$useFormReplacement = <<<'EOF'
        country_id: countries.length > 0 ? countries[0].id : 1,
        parent_category_id: "",
        category_id: "",
        account_id: "",
        password: "",
    });
EOF;
$content = str_replace($useFormTarget, $useFormReplacement, $content);

// 3. Add account_id to openEditModal
$editTarget = <<<'EOF'
            country_id:
                customer.country_id ||
                (countries.length > 0 ? countries[0].id : 1),
            parent_category_id: parentId,
            category_id: customer.category_id || "",
        });
EOF;
$editReplacement = <<<'EOF'
            country_id:
                customer.country_id ||
                (countries.length > 0 ? countries[0].id : 1),
            parent_category_id: parentId,
            category_id: customer.category_id || "",
            account_id: customer.account_id || "",
        });
EOF;
$content = str_replace($editTarget, $editReplacement, $content);

file_put_contents($path, $content);
echo "Index.jsx props updated.";
