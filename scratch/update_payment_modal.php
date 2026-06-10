<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Contracts\Show.jsx';
$content = file_get_contents($path);

// Replace Payment Modal parts
$oldPaymentAccountsSection = <<<'EOF'
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'حساب الخزينة/البنك' : 'Cash/Bank Account'} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={paymentForm.primary_account_id}
                                onChange={(e) => setPaymentForm({...paymentForm, primary_account_id: e.target.value})}
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                {accounts.filter(a => a.type === 'asset' || a.type === 'liability').map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value={lang === 'ar' ? 'حساب الإيراد/الإيجار' : 'Revenue/Rent Account'} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={paymentForm.counter_account_id}
                                onChange={(e) => setPaymentForm({...paymentForm, counter_account_id: e.target.value})}
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
EOF;

$newPaymentAccountsSection = <<<'EOF'
                    <div>
                        <InputLabel value={lang === 'ar' ? 'حساب الخزينة/البنك' : 'Cash/Bank Account'} />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={paymentForm.primary_account_id}
                            onChange={(e) => setPaymentForm({...paymentForm, primary_account_id: e.target.value})}
                            required
                        >
                            <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                            {accounts.filter(a => a.type === 'asset' || a.type === 'liability').map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                </option>
                            ))}
                        </select>
                    </div>
EOF;

$content = str_replace($oldPaymentAccountsSection, $newPaymentAccountsSection, $content);

// In invoice dropdown in Payment Modal, remove references to `inv.amount`
$oldInvoiceDropdown = <<<'EOF'
                            {selectedPaymentPeriodInvoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoice_number} ({inv.amount} -
                                    : {inv.amount - inv.paid_amount})
                                </option>
                            ))}
EOF;

// If the previous replace somehow made it messy, I'll use regex to fix it
$content = preg_replace('/\{selectedPaymentPeriodInvoices\.map\(\(inv\) => \([\s\S]*?<\/option>\s*\)\)\}/m', <<<EOF
                            {financialInvoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoice_number} ({inv.total_amount} - المتبقي: {inv.total_amount - inv.paid_amount})
                                </option>
                            ))}
EOF
, $content);

file_put_contents($path, $content);
echo "Done replacing payment modal fields.";
