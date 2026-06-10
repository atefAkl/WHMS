<?php

$path = 'C:\laragon\www\WHMS\resources\js\Pages\Customers\Index.jsx';
$content = file_get_contents($path);

// Insert statement button next to edit button
$target = <<<'EOF'
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(
                                                                    customer,
                                                                );
                                                            }}
                                                            className="text-xs text-primary font-bold hover:underline py-1 px-2 hover:bg-primary/5 transition-colors"
                                                        >
                                                            {t(
                                                                "customers.edit_action",
                                                            )}
                                                        </button>
EOF;

$replacement = <<<'EOF'
                                                        <Link
                                                            href={route('customers.statement', customer.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-xs text-primary font-bold hover:underline py-1 px-2 hover:bg-primary/5 transition-colors"
                                                        >
                                                            {lang === 'ar' ? 'كشف حساب' : 'Statement'}
                                                        </Link>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(
                                                                    customer,
                                                                );
                                                            }}
                                                            className="text-xs text-primary font-bold hover:underline py-1 px-2 hover:bg-primary/5 transition-colors"
                                                        >
                                                            {t(
                                                                "customers.edit_action",
                                                            )}
                                                        </button>
EOF;

$content = str_replace($target, $replacement, $content);

file_put_contents($path, $content);
echo "Index.jsx statement button added.";
