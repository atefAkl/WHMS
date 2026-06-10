<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        // تنظيف الجدول قبل السينج لتجنب التكرار
        // تنظيف الجدول قبل السينج لتجنب التكرار
        Schema::disableForeignKeyConstraints();
        Account::truncate();
        Schema::enableForeignKeyConstraints();

        $accounts = [
            // ==========================================
            // 1. الأصول (Assets)
            // ==========================================
            [
                'code' => '1',
                'name_ar' => 'الأصول',
                'name_en' => 'Assets',
                'type' => 'asset',
                'normal_balance' => 'debit',
                'is_transactional' => false,
                'children' => [
                    // الأصول المتداولة
                    [
                        'code' => '11',
                        'name_ar' => 'الأصول المتداولة',
                        'name_en' => 'Current Assets',
                        'type' => 'asset',
                        'normal_balance' => 'debit',
                        'is_transactional' => false,
                        'children' => [
                            [
                                'code' => '1101',
                                'name_ar' => 'النقدية وما يعادلها',
                                'name_en' => 'Cash and Cash Equivalents',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '110101', 'name_ar' => 'الصندوق الرئيسي', 'name_en' => 'Main Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11010101', 'name_ar' => 'الصندوق الرئيسي 1', 'name_en' => 'Main Cash 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '110102', 'name_ar' => 'العهد النقدية', 'name_en' => 'Petty Cash / Custodies', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11010201', 'name_ar' => 'العهد النقدية 1', 'name_en' => 'Petty Cash / Custodies 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '1102',
                                'name_ar' => 'الحسابات البنكية',
                                'name_en' => 'Banks',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '110201', 'name_ar' => 'الحساب الجاري - محلي', 'name_en' => 'Current Account - Local', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11020101', 'name_ar' => 'الحساب الجاري - محلي 1', 'name_en' => 'Current Account - Local 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '110202', 'name_ar' => 'الحساب الجاري - أجنبي', 'name_en' => 'Current Account - Foreign', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11020201', 'name_ar' => 'الحساب الجاري - أجنبي 1', 'name_en' => 'Current Account - Foreign 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '1103',
                                'name_ar' => 'العملاء والذمم المدينة',
                                'name_en' => 'Accounts Receivable',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '110301', 'name_ar' => 'العملاء التجاريين', 'name_en' => 'Trade Debtors', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11030101', 'name_ar' => 'العملاء التجاريين 1', 'name_en' => 'Trade Debtors 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '110302', 'name_ar' => 'مخصص خسائر ائتمانية متوقعة', 'name_en' => 'Allowance for Expected Credit Losses', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '11030201', 'name_ar' => 'مخصص خسائر ائتمانية متوقعة 1', 'name_en' => 'Allowance for Expected Credit Losses 1', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ], // حساب مقابل (Contra Account) دائن
                                ]
                            ],
                            [
                                'code' => '1104',
                                'name_ar' => 'المخزون',
                                'name_en' => 'Inventory',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '110401', 'name_ar' => 'مخزن المواد الخام', 'name_en' => 'Raw Materials Store', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11040101', 'name_ar' => 'مخزن المواد الخام 1', 'name_en' => 'Raw Materials Store 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '110402', 'name_ar' => 'مخزن البضاعة الجاهزة', 'name_en' => 'Finished Goods Store', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11040201', 'name_ar' => 'مخزن البضاعة الجاهزة 1', 'name_en' => 'Finished Goods Store 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '1105',
                                'name_ar' => 'أرصدة مدينة أخرى',
                                'name_en' => 'Other Debit Balances',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '110501', 'name_ar' => 'مصروفات مدفوعة مقدماً', 'name_en' => 'Prepaid Expenses', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11050101', 'name_ar' => 'مصروفات مدفوعة مقدماً 1', 'name_en' => 'Prepaid Expenses 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '110502', 'name_ar' => 'سلف الموظفين', 'name_en' => 'Employee Advances', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11050201', 'name_ar' => 'سلف الموظفين 1', 'name_en' => 'Employee Advances 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '110503', 'name_ar' => 'ضريبة القيمة المضافة المدخلات (المستردة)', 'name_en' => 'Input VAT', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '11050301', 'name_ar' => 'ضريبة القيمة المضافة المدخلات (المستردة) 1', 'name_en' => 'Input VAT 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ]
                        ]
                    ],
                    // الأصول الثابتة
                    [
                        'code' => '12',
                        'name_ar' => 'الأصول الثابتة',
                        'name_en' => 'Fixed Assets',
                        'type' => 'asset',
                        'normal_balance' => 'debit',
                        'is_transactional' => false,
                        'children' => [
                            [
                                'code' => '1201',
                                'name_ar' => 'العقارات والمباني',
                                'name_en' => 'Buildings & Real Estate',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '120101', 'name_ar' => 'تكلفة المباني', 'name_en' => 'Buildings Cost', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '12010101', 'name_ar' => 'تكلفة المباني 1', 'name_en' => 'Buildings Cost 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '120102', 'name_ar' => 'مجمع إهلاك المباني', 'name_en' => 'Accumulated Depreciation - Buildings', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '12010201', 'name_ar' => 'مجمع إهلاك المباني 1', 'name_en' => 'Accumulated Depreciation - Buildings 1', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '1202',
                                'name_ar' => 'الآلات والمعدات',
                                'name_en' => 'Machinery & Equipment',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '120201', 'name_ar' => 'تكلفة الآلات والمعدات', 'name_en' => 'Machinery Cost', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '12020101', 'name_ar' => 'تكلفة الآلات والمعدات 1', 'name_en' => 'Machinery Cost 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '120202', 'name_ar' => 'مجمع إهلاك الآلات والمعدات', 'name_en' => 'Accumulated Depreciation - Machinery', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '12020201', 'name_ar' => 'مجمع إهلاك الآلات والمعدات 1', 'name_en' => 'Accumulated Depreciation - Machinery 1', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '1203',
                                'name_ar' => 'أجهزة الحاسب الآلي والبرامج',
                                'name_en' => 'Computers & Software',
                                'type' => 'asset',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '120301', 'name_ar' => 'تكلفة الأجهزة والبرامج', 'name_en' => 'Computers Cost', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '12030101', 'name_ar' => 'تكلفة الأجهزة والبرامج 1', 'name_en' => 'Computers Cost 1', 'type' => 'asset', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '120302', 'name_ar' => 'مجمع إهلاك الحاسب الآلي', 'name_en' => 'Accumulated Depreciation - Computers', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '12030201', 'name_ar' => 'مجمع إهلاك الحاسب الآلي 1', 'name_en' => 'Accumulated Depreciation - Computers 1', 'type' => 'asset', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ]
                        ]
                    ]
                ]
            ],

            // ==========================================
            // 2. الالتزامـات / الخصوم (Liabilities)
            // ==========================================
            [
                'code' => '2',
                'name_ar' => 'الخصوم',
                'name_en' => 'Liabilities',
                'type' => 'liability',
                'normal_balance' => 'credit',
                'is_transactional' => false,
                'children' => [
                    // التزامات متداولة
                    [
                        'code' => '21',
                        'name_ar' => 'الالتزامات المتداولة',
                        'name_en' => 'Current Liabilities',
                        'type' => 'liability',
                        'normal_balance' => 'credit',
                        'is_transactional' => false,
                        'children' => [
                            [
                                'code' => '2101',
                                'name_ar' => 'الموردين والذمم الدائنة',
                                'name_en' => 'Accounts Payable',
                                'type' => 'liability',
                                'normal_balance' => 'credit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '210101', 'name_ar' => 'الموردين التجاريين', 'name_en' => 'Trade Creditors', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21010101', 'name_ar' => 'الموردين التجاريين 1', 'name_en' => 'Trade Creditors 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '210102', 'name_ar' => 'أوراق الدفع (شيكات صادرة مؤجلة)', 'name_en' => 'Notes Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21010201', 'name_ar' => 'أوراق الدفع (شيكات صادرة مؤجلة) 1', 'name_en' => 'Notes Payable 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '2102',
                                'name_ar' => 'أرصدة دائنة ومستحقات أخرى',
                                'name_en' => 'Accrued & Other Liabilities',
                                'type' => 'liability',
                                'normal_balance' => 'credit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '210201', 'name_ar' => 'الرواتب والأجور المستحقة', 'name_en' => 'Accrued Salaries', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21020101', 'name_ar' => 'الرواتب والأجور المستحقة 1', 'name_en' => 'Accrued Salaries 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '210202', 'name_ar' => 'مصروفات مستحقة غير مدفوعة', 'name_en' => 'Accrued Expenses', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21020201', 'name_ar' => 'مصروفات مستحقة غير مدفوعة 1', 'name_en' => 'Accrued Expenses 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '210203', 'name_ar' => 'إيرادات مقبوضة مقدماً', 'name_en' => 'Unearned Revenues', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21020301', 'name_ar' => 'إيرادات مقبوضة مقدماً 1', 'name_en' => 'Unearned Revenues 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '2103',
                                'name_ar' => 'الالتزامات الضريبية والزكوية',
                                'name_en' => 'Tax & Zakat Liabilities',
                                'type' => 'liability',
                                'normal_balance' => 'credit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '210301', 'name_ar' => 'ضريبة القيمة المضافة المخرجات (المستحقة)', 'name_en' => 'Output VAT', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21030101', 'name_ar' => 'ضريبة القيمة المضافة المخرجات (المستحقة) 1', 'name_en' => 'Output VAT 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '210302', 'name_ar' => 'مخصص الزكاة الشرعية', 'name_en' => 'Zakat Provision', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21030201', 'name_ar' => 'مخصص الزكاة الشرعية 1', 'name_en' => 'Zakat Provision 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '210303', 'name_ar' => 'مخصص ضريبة الدخل (للأجانب)', 'name_en' => 'Income Tax Provision', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                ['code' => '21030301', 'name_ar' => 'مخصص ضريبة الدخل (للأجانب) 1', 'name_en' => 'Income Tax Provision 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ]
                        ]
                    ],
                    // التزامات غير متداولة
                    [
                        'code' => '22',
                        'name_ar' => 'الالتزامات غير المتداولة',
                        'name_en' => 'Non-Current Liabilities',
                        'type' => 'liability',
                        'normal_balance' => 'credit',
                        'is_transactional' => false,
                        'children' => [
                            [
            'code' => '2201', 'name_ar' => 'قروض بنكية طويلة الأجل', 'name_en' => 'Long-term Bank Loans', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '220101', 'name_ar' => 'قروض بنكية طويلة الأجل - عام', 'name_en' => 'Long-term Bank Loans - General', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '22010101', 'name_ar' => 'قروض بنكية طويلة الأجل 1', 'name_en' => 'Long-term Bank Loans 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                            [
            'code' => '2202', 'name_ar' => 'مخصص مكافأة نهاية الخدمة للموظفين', 'name_en' => 'End of Service Benefits Provision (EOSB)', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '220201', 'name_ar' => 'مخصص مكافأة نهاية الخدمة للموظفين - عام', 'name_en' => 'End of Service Benefits Provision (EOSB) - General', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '22020101', 'name_ar' => 'مخصص مكافأة نهاية الخدمة للموظفين 1', 'name_en' => 'End of Service Benefits Provision (EOSB) 1', 'type' => 'liability', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                        ]
                    ]
                ]
            ],

            // ==========================================
            // 3. حقوق الملكية (Equity)
            // ==========================================
            [
                'code' => '3',
                'name_ar' => 'حقوق الملكية',
                'name_en' => 'Equity',
                'type' => 'equity',
                'normal_balance' => 'credit',
                'is_transactional' => false,
                'children' => [
                    [
            'code' => '3101', 'name_ar' => 'رأس المال المدفوع', 'name_en' => 'Paid-in Capital', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '310101', 'name_ar' => 'رأس المال المدفوع - عام', 'name_en' => 'Paid-in Capital - General', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '31010101', 'name_ar' => 'رأس المال المدفوع 1', 'name_en' => 'Paid-in Capital 1', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                    [
            'code' => '3102', 'name_ar' => 'الاحتياطي النظامي', 'name_en' => 'Statutory Reserve', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '310201', 'name_ar' => 'الاحتياطي النظامي - عام', 'name_en' => 'Statutory Reserve - General', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '31020101', 'name_ar' => 'الاحتياطي النظامي 1', 'name_en' => 'Statutory Reserve 1', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                    [
            'code' => '3103', 'name_ar' => 'الأرباح المبقاة (المحتجزة)', 'name_en' => 'Retained Earnings', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '310301', 'name_ar' => 'الأرباح المبقاة (المحتجزة) - عام', 'name_en' => 'Retained Earnings - General', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '31030101', 'name_ar' => 'الأرباح المبقاة (المحتجزة) 1', 'name_en' => 'Retained Earnings 1', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                    [
            'code' => '3104', 'name_ar' => 'أرباح / خسائر العام الحالي', 'name_en' => 'Current Year Earnings / Losses', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '310401', 'name_ar' => 'أرباح / خسائر العام الحالي - عام', 'name_en' => 'Current Year Earnings / Losses - General', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '31040101', 'name_ar' => 'أرباح / خسائر العام الحالي 1', 'name_en' => 'Current Year Earnings / Losses 1', 'type' => 'equity', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                    [
            'code' => '3105', 'name_ar' => 'مسحوبات الشركاء / الجاري', 'name_en' => 'Partner Drawings / Current Account', 'type' => 'equity', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '310501', 'name_ar' => 'مسحوبات الشركاء / الجاري - عام', 'name_en' => 'Partner Drawings / Current Account - General', 'type' => 'equity', 'normal_balance' => 'debit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '31050101', 'name_ar' => 'مسحوبات الشركاء / الجاري 1', 'name_en' => 'Partner Drawings / Current Account 1', 'type' => 'equity', 'normal_balance' => 'debit', 'is_transactional' => true],
                    ]
                ]
            ]
        ], // طبيعته مدينة غالباً عند السحب
                ]
            ],

            // ==========================================
            // 4. الإيرادات (Revenues)
            // ==========================================
            [
                'code' => '4',
                'name_ar' => 'الإيرادات',
                'name_en' => 'Revenues',
                'type' => 'revenue',
                'normal_balance' => 'credit',
                'is_transactional' => false,
                'children' => [
                    [
                        'code' => '41',
                        'name_ar' => 'الإيرادات النشاط التشغيلي',
                        'name_en' => 'Operating Revenues',
                        'type' => 'revenue',
                        'normal_balance' => 'credit',
                        'is_transactional' => false,
                        'children' => [
                            [
            'code' => '4101', 'name_ar' => 'إيرادات المبيعات (السلع)', 'name_en' => 'Sales Revenues', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '410101', 'name_ar' => 'إيرادات المبيعات (السلع) - عام', 'name_en' => 'Sales Revenues - General', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '41010101', 'name_ar' => 'إيرادات المبيعات (السلع) 1', 'name_en' => 'Sales Revenues 1', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                            [
            'code' => '4102', 'name_ar' => 'إيرادات تقديم الخدمات', 'name_en' => 'Service Revenues', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '410201', 'name_ar' => 'إيرادات تقديم الخدمات - عام', 'name_en' => 'Service Revenues - General', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '41020101', 'name_ar' => 'إيرادات تقديم الخدمات 1', 'name_en' => 'Service Revenues 1', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                            [
            'code' => '4103', 'name_ar' => 'مردودات ومسموحات المبيعات', 'name_en' => 'Sales Returns & Allowances', 'type' => 'revenue', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '410301', 'name_ar' => 'مردودات ومسموحات المبيعات - عام', 'name_en' => 'Sales Returns & Allowances - General', 'type' => 'revenue', 'normal_balance' => 'debit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '41030101', 'name_ar' => 'مردودات ومسموحات المبيعات 1', 'name_en' => 'Sales Returns & Allowances 1', 'type' => 'revenue', 'normal_balance' => 'debit', 'is_transactional' => true],
                    ]
                ]
            ]
        ], // Contra revenue مدين
                        ]
                    ],
                    [
                        'code' => '42',
                        'name_ar' => 'إيرادات أخرى غير تشغيلية',
                        'name_en' => 'Other Revenues / Income',
                        'type' => 'revenue',
                        'normal_balance' => 'credit',
                        'is_transactional' => false,
                        'children' => [
                            [
            'code' => '4201', 'name_ar' => 'إيرادات استثمارات وفروق عملة', 'name_en' => 'Investment & FX Gains', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '420101', 'name_ar' => 'إيرادات استثمارات وفروق عملة - عام', 'name_en' => 'Investment & FX Gains - General', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '42010101', 'name_ar' => 'إيرادات استثمارات وفروق عملة 1', 'name_en' => 'Investment & FX Gains 1', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                            [
            'code' => '4202', 'name_ar' => 'أرباح بيع أصول ثابتة', 'name_en' => 'Gains on Disposal of Fixed Assets', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '420201', 'name_ar' => 'أرباح بيع أصول ثابتة - عام', 'name_en' => 'Gains on Disposal of Fixed Assets - General', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '42020101', 'name_ar' => 'أرباح بيع أصول ثابتة 1', 'name_en' => 'Gains on Disposal of Fixed Assets 1', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                        ]
                    ]
                ]
            ],

            // ==========================================
            // 5. المصروفات (Expenses)
            // ==========================================
            [
                'code' => '5',
                'name_ar' => 'المصروفات',
                'name_en' => 'Expenses',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'is_transactional' => false,
                'children' => [
                    // تكلفة المبيعات / النشاط
                    [
                        'code' => '51',
                        'name_ar' => 'تكلفة النشاط / المبيعات',
                        'name_en' => 'Cost of Goods Sold (COGS)',
                        'type' => 'expense',
                        'normal_balance' => 'debit',
                        'is_transactional' => false,
                        'children' => [
                            [
            'code' => '5101', 'name_ar' => 'تكلفة المواد والمشتريات', 'name_en' => 'Purchases Cost', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '510101', 'name_ar' => 'تكلفة المواد والمشتريات - عام', 'name_en' => 'Purchases Cost - General', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '51010101', 'name_ar' => 'تكلفة المواد والمشتريات 1', 'name_en' => 'Purchases Cost 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                            [
            'code' => '5102', 'name_ar' => 'تكلفة العمالة المباشرة (التشغيلية)', 'name_en' => 'Direct Labor Cost', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '510201', 'name_ar' => 'تكلفة العمالة المباشرة (التشغيلية) - عام', 'name_en' => 'Direct Labor Cost - General', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '51020101', 'name_ar' => 'تكلفة العمالة المباشرة (التشغيلية) 1', 'name_en' => 'Direct Labor Cost 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                        ]
                    ],
                    // مصروفات عمومية وإدارية
                    [
                        'code' => '52',
                        'name_ar' => 'مصروفات عمومية وإدارية',
                        'name_en' => 'General & Administrative Expenses',
                        'type' => 'expense',
                        'normal_balance' => 'debit',
                        'is_transactional' => false,
                        'children' => [
                            [
                                'code' => '5201',
                                'name_ar' => 'مصروفات الموظفين',
                                'name_en' => 'Staff Costs',
                                'type' => 'expense',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '520101', 'name_ar' => 'الرواتب والأجور الأساسية', 'name_en' => 'Basic Salaries', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52010101', 'name_ar' => 'الرواتب والأجور الأساسية 1', 'name_en' => 'Basic Salaries 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520102', 'name_ar' => 'البدلات (سكن، انتقال، إلخ)', 'name_en' => 'Allowances', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52010201', 'name_ar' => 'البدلات (سكن، انتقال، إلخ) 1', 'name_en' => 'Allowances 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520103', 'name_ar' => 'التأمينات الاجتماعية (حصة الشركة)', 'name_en' => 'GOSI Contribution', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52010301', 'name_ar' => 'التأمينات الاجتماعية (حصة الشركة) 1', 'name_en' => 'GOSI Contribution 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520104', 'name_ar' => 'التأمين الطبي للموظفين', 'name_en' => 'Medical Insurance', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52010401', 'name_ar' => 'التأمين الطبي للموظفين 1', 'name_en' => 'Medical Insurance 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '5202',
                                'name_ar' => 'مصروفات التشغيل الإدارية',
                                'name_en' => 'Administrative Operating Costs',
                                'type' => 'expense',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '520201', 'name_ar' => 'الإيجارات', 'name_en' => 'Rent Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52020101', 'name_ar' => 'الإيجارات 1', 'name_en' => 'Rent Expense 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520202', 'name_ar' => 'الكهرباء والمياه والاتصالات', 'name_en' => 'Utilities & Telecoms', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52020201', 'name_ar' => 'الكهرباء والمياه والاتصالات 1', 'name_en' => 'Utilities & Telecoms 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520203', 'name_ar' => 'الرسوم الحكومية وتراخيص البلدية والسجل', 'name_en' => 'Government Fees & Licenses', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52020301', 'name_ar' => 'الرسوم الحكومية وتراخيص البلدية والسجل 1', 'name_en' => 'Government Fees & Licenses 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520204', 'name_ar' => 'الأدوات المكتبية والمطبوعات', 'name_en' => 'Stationery & Printing', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52020401', 'name_ar' => 'الأدوات المكتبية والمطبوعات 1', 'name_en' => 'Stationery & Printing 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520205', 'name_ar' => 'العمولات والمصروفات البنكية', 'name_en' => 'Bank Charges & Commissions', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52020501', 'name_ar' => 'العمولات والمصروفات البنكية 1', 'name_en' => 'Bank Charges & Commissions 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ],
                            [
                                'code' => '5203',
                                'name_ar' => 'مصروفات الإهلاك والزكاة والضرائب',
                                'name_en' => 'Depreciation, Zakat & Tax Expenses',
                                'type' => 'expense',
                                'normal_balance' => 'debit',
                                'is_transactional' => false,
                                'children' => [
                                    [
            'code' => '520301', 'name_ar' => 'مصروف إهلاك الأصول الثابتة', 'name_en' => 'Depreciation Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52030101', 'name_ar' => 'مصروف إهلاك الأصول الثابتة 1', 'name_en' => 'Depreciation Expense 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                    [
            'code' => '520302', 'name_ar' => 'مصروف الزكاة التقديري للعام', 'name_en' => 'Zakat Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                ['code' => '52030201', 'name_ar' => 'مصروف الزكاة التقديري للعام 1', 'name_en' => 'Zakat Expense 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
            ]
        ],
                                ]
                            ]
                        ]
                    ],
                    // مصروفات تسويقية وبيعية
                    [
                        'code' => '53',
                        'name_ar' => 'مصروفات بيعية وتسويقية',
                        'name_en' => 'Selling & Marketing Expenses',
                        'type' => 'expense',
                        'normal_balance' => 'debit',
                        'is_transactional' => false,
                        'children' => [
                            [
            'code' => '5301', 'name_ar' => 'الدعاية والإعلان والتسويق الرقمي', 'name_en' => 'Advertising & Marketing', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '530101', 'name_ar' => 'الدعاية والإعلان والتسويق الرقمي - عام', 'name_en' => 'Advertising & Marketing - General', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '53010101', 'name_ar' => 'الدعاية والإعلان والتسويق الرقمي 1', 'name_en' => 'Advertising & Marketing 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                            [
            'code' => '5302', 'name_ar' => 'عمولات رجال البيع / المناديب', 'name_en' => 'Sales Commissions', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
            'children' => [
                [
                    'code' => '530201', 'name_ar' => 'عمولات رجال البيع / المناديب - عام', 'name_en' => 'Sales Commissions - General', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => false,
                    'children' => [
                        ['code' => '53020101', 'name_ar' => 'عمولات رجال البيع / المناديب 1', 'name_en' => 'Sales Commissions 1', 'type' => 'expense', 'normal_balance' => 'debit', 'is_transactional' => true],
                    ]
                ]
            ]
        ],
                        ]
                    ]
                ]
            ]
        ];

        // استدعاء الدالة التكرارية لبناء الـ Tree داخل قاعدة البيانات
        $this->saveAccountsRecursive($accounts);
    }

    /**
     * دالة تكرارية (Recursive Function) لحفظ الحسابات بأي مستوى عمق بشكل ديناميكي
     */
    private function saveAccountsRecursive(array $accounts, ?int $parentId = null): void
    {
        foreach ($accounts as $accountData) {
            // فصل الـ children عن البيانات الأساسية للحساب
            $children = $accountData['children'] ?? [];
            unset($accountData['children']);

            // إضافة الـ parent_id للحساب الحالي
            $accountData['parent_id'] = $parentId;

            // إنشاء الحساب في الداتابيز
            $account = Account::create($accountData);

            // لو عنده حسابات فرعية، استدعي الدالة تاني ومرر الـ id الحالي كـ parent_id
            if (!empty($children)) {
                $this->saveAccountsRecursive($children, $account->id);
            }
        }
    }
}
