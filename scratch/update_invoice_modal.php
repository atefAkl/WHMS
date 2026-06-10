<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Contracts\Show.jsx';
$content = file_get_contents($path);

// Replace Invoice Modal body
$oldInvoiceFormFields = <<<'EOF'
                    <div>
                        <InputLabel value={lang === "ar" ? "الوصف" : "Description"} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={invoiceForm.description}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    description: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={lang === "ar" ? "التاريخ" : "Date"} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={invoiceForm.date}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={lang === "ar" ? "حساب الإيراد" : "Revenue Account"} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={invoiceForm.revenue_account_id}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        revenue_account_id: e.target.value,
                                    })
                                }
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر حساب...' : 'Select Account...'}</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t("show.amount_due")} />
                            <TextInput
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full font-mono"
                                value={invoiceForm.amount}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        amount: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={lang === "ar" ? "نسبة الضريبة %" : "Tax Rate %"} />
                            <TextInput
                                type="number"
                                step="1"
                                className="mt-1 block w-full font-mono"
                                value={invoiceForm.tax_rate}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        tax_rate: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>
EOF;

$newInvoiceFormFields = <<<'EOF'
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t("show.invoice_number")} />
                            <TextInput
                                type="text"
                                className="mt-1 block w-full font-mono"
                                value={invoiceForm.invoice_number}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        invoice_number: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={t("show.issue_date")} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={invoiceForm.date}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <InputLabel value={t("show.notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={invoiceForm.notes}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    notes: e.target.value,
                                })
                            }
                        />
                    </div>
EOF;

$content = str_replace($oldInvoiceFormFields, $newInvoiceFormFields, $content);

file_put_contents($path, $content);
echo "Done replacing invoice modal fields.";
