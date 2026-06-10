<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Customers\Index.jsx';
$content = file_get_contents($path);

// Insert account_id select after country_id
$target = <<<'EOF'
                            <InputError
                                message={errors.country_id}
                                className="mt-1"
                            />
                        </div>
EOF;

$replacement = <<<'EOF'
                            <InputError
                                message={errors.country_id}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="account_id"
                                value={lang === 'ar' ? 'ربط بحساب (الذمم/العملاء)' : 'Link to Account (Receivables)'}
                            />
                            <select
                                id="account_id"
                                className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={data.account_id}
                                onChange={(e) =>
                                    setData("account_id", e.target.value)
                                }
                            >
                                <option value="">
                                    {lang === 'ar' ? 'بدون ربط' : 'No link'}
                                </option>
                                {accounts?.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {lang === 'ar' ? acc.name_ar : acc.name_en}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.account_id}
                                className="mt-1"
                            />
                        </div>
EOF;

$content = str_replace($target, $replacement, $content);

file_put_contents($path, $content);
echo "Index.jsx inputs updated.";
