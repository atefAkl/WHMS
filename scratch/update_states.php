<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Contracts\Show.jsx';
$content = file_get_contents($path);

// 1. Update invoiceForm state
$invoiceFormReplacement = <<<EOF
    const [invoiceForm, setInvoiceForm] = useState({
        period_id: contract.periods?.find((period) => period.status === "active")?.id || contract.periods?.[0]?.id || "",
        invoice_number: `INV-\${contract.contract_number}-\${(contract.invoices?.length || 0) + 1}`,
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });
EOF;

$content = preg_replace('/const \[invoiceForm, setInvoiceForm\] = useState\(\{(.*?)\}\);/s', trim($invoiceFormReplacement), $content, 1);

// 2. Update paymentForm state
$paymentFormReplacement = <<<EOF
    const [paymentForm, setPaymentForm] = useState({
        period_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        method: "bank_transfer",
        reference: "",
        notes: "",
        invoice_id: "",
        primary_account_id: "",
    });
EOF;

$content = preg_replace('/const \[paymentForm, setPaymentForm\] = useState\(\{(.*?)\}\);/s', trim($paymentFormReplacement), $content, 1);

file_put_contents($path, $content);
echo "Done replacing states.";
