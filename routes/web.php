<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Ensure domains list is unique to avoid duplicate route names when caching routes
$centralDomains = array_unique(config('tenancy.central_domains', ['whm.apl', 'www.whm.apl', 'localhost', '127.0.0.1']));

foreach ($centralDomains as $domain) {
    Route::domain($domain)->group(function () {
        Route::get('/', function () {
            return Inertia::render('Welcome', [
                'canLogin' => Route::has('login'),
                'canRegister' => Route::has('register'),
                'laravelVersion' => Application::VERSION,
                'phpVersion' => PHP_VERSION,
            ]);
        })->name('central.welcome');

        // Public routes - no auth required (for new tenant registration)
        Route::post('/register-warehouse', [\App\Http\Controllers\TenantRequestController::class, 'store'])->name('tenant.register.store');
        Route::get('/register-warehouse/pending', [\App\Http\Controllers\TenantRequestController::class, 'pending'])->name('tenant.register.pending');

        Route::middleware('auth')->group(function () {
            Route::get('/profile', [ProfileController::class, 'edit'])->name('central.profile.edit');
            Route::patch('/profile', [ProfileController::class, 'update'])->name('central.profile.update');
            Route::delete('/profile', [ProfileController::class, 'destroy'])->name('central.profile.destroy');
            Route::post('/profile/preferences', [ProfileController::class, 'updatePreferences'])->name('central.profile.preferences');

            // Central SaaS Management Dashboard (SaaSController)
            Route::get('/tenants', [\App\Http\Controllers\SaaSController::class, 'index'])->name('saas.tenants.index');
            Route::get('/requests', [\App\Http\Controllers\SaaSController::class, 'index'])->name('saas.tenants.requests');
            Route::post('/requests/{tenantRequest}/approve', [\App\Http\Controllers\SaaSController::class, 'approveRequest'])->name('saas.tenants.approve');
            Route::post('/requests/{tenantRequest}/reject', [\App\Http\Controllers\SaaSController::class, 'rejectRequest'])->name('saas.tenants.reject');
            // Tenant management: disable or delete tenant
            Route::post('/tenants/{tenant}/disable', [\App\Http\Controllers\SaaSController::class, 'disableTenant'])->name('saas.tenants.disable');
            Route::delete('/tenants/{tenant}', [\App\Http\Controllers\SaaSController::class, 'destroyTenant'])->name('saas.tenants.destroy');

            // Central SaaS Settings (SaaSSettingController)
            Route::get('/settings', [\App\Http\Controllers\SaaSSettingController::class, 'settingsIndex'])->name('saas.settings.index');

            Route::get('/settings/tenants', [\App\Http\Controllers\SaaSSettingController::class, 'tenantSettings'])->name('saas.settings.tenants');
            Route::post('/settings/tenants', [\App\Http\Controllers\SaaSSettingController::class, 'updateTenantSettings'])->name('saas.settings.tenants.update');

            Route::get('/settings/terms', [\App\Http\Controllers\SaaSSettingController::class, 'termsSettings'])->name('saas.settings.terms');
            Route::post('/settings/terms', [\App\Http\Controllers\SaaSSettingController::class, 'updateGlobalTerms'])->name('saas.settings.terms.update');

            Route::get('/settings/contracts', [\App\Http\Controllers\SaaSSettingController::class, 'contractSettings'])->name('saas.settings.contracts');
            Route::post('/settings/contracts', [\App\Http\Controllers\SaaSSettingController::class, 'updateContractSettings'])->name('saas.settings.contracts.update');

            Route::get('/settings/geo-settings', [\App\Http\Controllers\SaaSSettingController::class, 'geoSettings'])->name('saas.settings.geo');
            Route::get('/settings/financial', [\App\Http\Controllers\SaaSSettingController::class, 'financialSettings'])->name('saas.settings.financial');
            Route::get('/settings/themes', [\App\Http\Controllers\SaaSSettingController::class, 'themesSettings'])->name('saas.settings.themes');
            Route::get('/settings/notifications', [\App\Http\Controllers\SaaSSettingController::class, 'notificationsSettings'])->name('saas.settings.notifications');
            Route::get('/settings/roles-permissions', [\App\Http\Controllers\SaaSSettingController::class, 'rolesPermissions'])->name('saas.settings.roles');
        });

        // Deployment Helpers for cPanel (without SSH)
        Route::get('/deploy-migrations-90083', function () {
            try {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                \Illuminate\Support\Facades\Artisan::call('tenants:migrate', ['--force' => true]);
                return "Migrations Run Success:<br><pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre>";
            } catch (\Exception $e) {
                return "Error: " . $e->getMessage();
            }
        });

        // Prepare local/tenant schema (Migrate fresh structure + Truncate data)
        Route::get('/prepare-tenant-schema-90083', function (\Illuminate\Http\Request $request) {
            try {
                $tenantId = $request->query('tenant');
                $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : \App\Models\Tenant::first();

                if (!$tenant) {
                    return response('No tenant found', 404);
                }

                \Illuminate\Support\Facades\Artisan::call('tenants:run', [
                    'commandname' => 'migrate --force',
                    '--tenants' => [$tenant->id]
                ]);

                tenancy()->initialize($tenant);
                $tables = [
                    'customers',
                    'contracts',
                    'contract_periods',
                    'contract_agents',
                    'drivers',
                    'inventory_categories',
                    'inventory_items',
                    'inventory_item_variants',
                    'pallets',
                    'receptions',
                    'deliveries',
                    'inventory_adjustments',
                    'pallet_rearrangements',
                    'inventory_entries',
                    'users',
                ];

                foreach ($tables as $table) {
                    if (\Illuminate\Support\Facades\Schema::hasTable($table)) {
                        \Illuminate\Support\Facades\DB::statement('TRUNCATE TABLE "' . $table . '" CASCADE');
                    }
                }
                tenancy()->end();

                return "Tenant Schema Prepared & Truncated Successfully for tenant: " . $tenant->id;
            } catch (\Exception $e) {
                return response("Error preparing schema: " . $e->getMessage(), 500);
            }
        });

        Route::get('/deploy-seed-90083', function () {
            try {
                \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
                return "Seeding Success:<br><pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre>";
            } catch (\Exception $e) {
                return "Error: " . $e->getMessage();
            }
        });

        // 100% Guaranteed Tenant SQL Backup Dump Helper
        Route::get('/dump-tenant-90083', function (\Illuminate\Http\Request $request) {
            try {
                $tenantId = $request->query('tenant');
                $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : \App\Models\Tenant::first();

                if (!$tenant) {
                    return response('No tenant found', 404);
                }

                $tenantId = $tenant->id;
                tenancy()->initialize($tenant);

                $tables = [
                    'customers',
                    'contracts',
                    'contract_periods',
                    'contract_agents',
                    'drivers',
                    'inventory_categories',
                    'inventory_items',
                    'inventory_item_variants',
                    'pallets',
                    'receptions',
                    'deliveries',
                    'inventory_adjustments',
                    'pallet_rearrangements',
                    'inventory_entries',
                    'users',
                ];

                $sql = "-- WHMS Tenant Backup for Tenant: {$tenantId}\n";
                $sql .= "-- Generated at: " . date('Y-m-d H:i:s') . "\n\n";
                $sql .= "SET session_replication_role = 'replica';\n\n";

                foreach ($tables as $table) {
                    if (!\Illuminate\Support\Facades\Schema::hasTable($table)) {
                        continue;
                    }

                    $rows = \Illuminate\Support\Facades\DB::table($table)->get();
                    if ($rows->isEmpty()) {
                        continue;
                    }

                    $sql .= "-- Data for table {$table}\n";
                    foreach ($rows as $row) {
                        $array = (array) $row;
                        $columns = array_keys($array);
                        $escapedColumns = array_map(fn($col) => '"' . $col . '"', $columns);
                        
                        $values = array_map(function ($val) {
                            if (is_null($val)) return 'NULL';
                            if (is_bool($val)) return $val ? 'TRUE' : 'FALSE';
                            if (is_numeric($val)) return $val;
                            $str = (string) $val;
                            $str = str_replace(["\r\n", "\r", "\n"], "\\n", $str);
                            $str = str_replace("'", "''", $str);
                            return "'" . $str . "'";
                        }, array_values($array));

                        $sql .= 'INSERT INTO "' . $table . '" (' . implode(', ', $escapedColumns) . ') VALUES (' . implode(', ', $values) . ");\n";
                    }
                    $sql .= "\n";
                }

                $sql .= "SET session_replication_role = 'origin';\n";

                tenancy()->end();

                return response($sql, 200, [
                    'Content-Type' => 'text/plain; charset=UTF-8',
                    'Content-Disposition' => 'attachment; filename="tenant_' . $tenantId . '_dump.sql"',
                ]);
            } catch (\Exception $e) {
                return response("Error generating dump: " . $e->getMessage(), 500);
            }
        });

        require __DIR__ . '/auth.php';
    });
}

// Unscoped fallback routes for deployment and dump (work on any domain or hosting setup)
Route::get('/dump-tenant-90083', function () {
    require public_path('dump_tenant_direct.php');
    exit;
});

Route::get('/deploy-migrations-90083', function () {
    require public_path('deploy_migrations_direct.php');
    exit;
});
