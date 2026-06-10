<?php

// 1. Create Migration
$migrationName = '2026_06_11_004800_add_account_id_to_customer_categories_table';
$migrationPath = 'C:\laragon\www\WHMS\database\migrations\tenant\\' . $migrationName . '.php';
$migrationContent = <<<'EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_categories', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable()->constrained('accounts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('customer_categories', function (Blueprint $table) {
            $table->dropForeign(['account_id']);
            $table->dropColumn('account_id');
        });
    }
};
EOF;
file_put_contents($migrationPath, $migrationContent);

// 2. Update Model
$modelPath = 'C:\laragon\www\WHMS\app\Models\CustomerCategory.php';
$modelContent = file_get_contents($modelPath);
$modelContent = str_replace(
    "protected \$fillable = ['parent_id', 'name_ar', 'name_en'];",
    "protected \$fillable = ['parent_id', 'name_ar', 'name_en', 'account_id'];",
    $modelContent
);
$modelRelation = <<<'EOF'
    public function customers()
    {
        return $this->hasMany(Customer::class, 'category_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
EOF;
$modelContent = str_replace(
    "    public function customers()\n    {\n        return \$this->hasMany(Customer::class, 'category_id');\n    }",
    $modelRelation,
    $modelContent
);
file_put_contents($modelPath, $modelContent);

// 3. Update Controller
$controllerPath = 'C:\laragon\www\WHMS\app\Http\Controllers\Settings\CustomerCategoryController.php';
$controllerContent = file_get_contents($controllerPath);
$controllerIndexTarget = <<<'EOF'
        return Inertia::render('Settings/Categories', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
        ]);
EOF;
$controllerIndexReplacement = <<<'EOF'
        $accounts = \App\Models\Account::where('is_transactional', true)
            ->where(function ($query) {
                $query->where('code', 'like', '1103%')
                      ->orWhere('code', 'like', '2101%');
            })
            ->get();

        return Inertia::render('Settings/Categories', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
            'accounts' => $accounts,
        ]);
EOF;
$controllerContent = str_replace($controllerIndexTarget, $controllerIndexReplacement, $controllerContent);

$controllerValTarget = <<<'EOF'
            'name_en' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:customer_categories,id',
EOF;
$controllerValReplacement = <<<'EOF'
            'name_en' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:customer_categories,id',
            'account_id' => 'nullable|exists:accounts,id',
EOF;
$controllerContent = str_replace($controllerValTarget, $controllerValReplacement, $controllerContent);
// second replacement since there are two validation rules (store and update)
$controllerContent = preg_replace('/\'parent_id\' => \'nullable\|exists:customer_categories,id\',/', "'parent_id' => 'nullable|exists:customer_categories,id',\n            'account_id' => 'nullable|exists:accounts,id',", $controllerContent);

file_put_contents($controllerPath, $controllerContent);

// 4. Update JSX Props & useForm
$jsxPath = 'C:\laragon\www\WHMS\resources\js\Pages\Settings\Categories.jsx';
$jsxContent = file_get_contents($jsxPath);

$jsxPropsTarget = "export default function Categories({ auth, categories, parentCategories }) {";
$jsxPropsReplacement = "export default function Categories({ auth, categories, parentCategories, accounts }) {";
$jsxContent = str_replace($jsxPropsTarget, $jsxPropsReplacement, $jsxContent);

$jsxFormTarget = <<<'EOF'
        name_en: "",
        parent_id: "",
    });
EOF;
$jsxFormReplacement = <<<'EOF'
        name_en: "",
        parent_id: "",
        account_id: "",
    });
EOF;
$jsxContent = str_replace($jsxFormTarget, $jsxFormReplacement, $jsxContent);

$jsxEditTarget = <<<'EOF'
            name_en: category.name_en,
            parent_id: category.parent_id || "",
        });
EOF;
$jsxEditReplacement = <<<'EOF'
            name_en: category.name_en,
            parent_id: category.parent_id || "",
            account_id: category.account_id || "",
        });
EOF;
$jsxContent = str_replace($jsxEditTarget, $jsxEditReplacement, $jsxContent);

// 5. Update JSX Input
$jsxInputTarget = <<<'EOF'
                                <InputError
                                    message={errors.parent_id}
                                    className="mt-1"
                                />
                            </div>
                        </div>
EOF;
$jsxInputReplacement = <<<'EOF'
                                <InputError
                                    message={errors.parent_id}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <InputLabel
                                htmlFor="account_id"
                                value={lang === 'ar' ? 'حساب الذمم المربوط' : 'Linked Account'}
                            />
                            <select
                                id="account_id"
                                className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={data.account_id}
                                onChange={(e) => setData("account_id", e.target.value)}
                            >
                                <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                {accounts?.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {lang === 'ar' ? acc.name_ar : acc.name_en}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.account_id} className="mt-1" />
                        </div>
EOF;
$jsxContent = str_replace($jsxInputTarget, $jsxInputReplacement, $jsxContent);

file_put_contents($jsxPath, $jsxContent);

echo "Update complete.";
