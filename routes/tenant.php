<?php

declare(strict_types=1);

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Foundation\Application;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    Route::get('/', function () {
        // If user is authenticated, send to the dashboard; otherwise show a public landing page.
        if (auth()->check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
    });

    require base_path('routes/auth.php');

    Route::middleware('guest')->group(function () {
        Route::get('/setup-password', [\App\Http\Controllers\TenantPasswordSetupController::class, 'show'])->name('tenant.password.setup');
        Route::post('/setup-password', [\App\Http\Controllers\TenantPasswordSetupController::class, 'store'])->name('tenant.password.store');
    });

    Route::middleware('auth')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::post('/profile/preferences', [ProfileController::class, 'updatePreferences'])->name('profile.preferences');
        Route::post('/profile/secure-password', [ProfileController::class, 'updateSecurePassword'])->name('profile.secure-password.update');

        // Tenant Onboarding / Setup
        Route::get('/tenant-setup', [\App\Http\Controllers\TenantSetupController::class, 'create'])->name('tenant.setup');
        Route::post('/tenant-setup', [\App\Http\Controllers\TenantSetupController::class, 'store'])->name('tenant.store');

        // API for settings
        Route::get('/api/settings', [\App\Http\Controllers\TenantSettingsController::class, 'index']);
        Route::post('/api/settings', [\App\Http\Controllers\TenantSettingsController::class, 'store']);

        // Routes that require a configured tenant
        Route::middleware('tenant')->group(function () {
            // Season Selection
            Route::get('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'create'])->name('season.select');
            Route::post('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'store'])->name('season.store');

            // Routes that require an active season
            Route::middleware('season')->group(function () {
                Route::get('/dashboard', function () {
                    return Inertia::render('Dashboard');
                })->name('dashboard');

                Route::resource('pallets', \App\Http\Controllers\PalletController::class)->except(['create', 'edit']);
                Route::resource('customers', \App\Http\Controllers\CustomerController::class)->except(['create', 'edit']);
                Route::resource('inventory-items', \App\Http\Controllers\InventoryItemController::class)->parameters(['inventory-items' => 'inventory_item'])->except(['create', 'edit']);
                Route::put('inventory-item-variants/{variant}', [\App\Http\Controllers\InventoryItemController::class, 'updateVariant'])->name('inventory-item-variants.update');
                Route::get('api/pallets/lookup', [\App\Http\Controllers\PalletController::class, 'lookup'])->name('api.pallets.lookup');
                Route::get('api/contracts/{contract}/occupancy-stats', [\App\Http\Controllers\ReceptionController::class, 'getOccupancyStats'])->name('api.contracts.occupancy-stats');
                Route::post('customers/{customer}/contacts', [\App\Http\Controllers\ContactController::class, 'store'])->name('customers.contacts.store');
                Route::put('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'update'])->name('customers.contacts.update');
                Route::delete('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'destroy'])->name('customers.contacts.destroy');

                // Contracts
                Route::get('contracts', [\App\Http\Controllers\ContractController::class, 'index'])->name('contracts.index');
                Route::get('contracts/create', [\App\Http\Controllers\ContractController::class, 'create'])->name('contracts.create');
                Route::post('contracts', [\App\Http\Controllers\ContractController::class, 'store'])->name('contracts.store');
                Route::get('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'show'])->name('contracts.show');
                Route::put('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'update'])->name('contracts.update');
                Route::post('contracts/{contract}/activate', [\App\Http\Controllers\ContractController::class, 'activate'])->name('contracts.activate');
                Route::post('contracts/{contract}/suspend', [\App\Http\Controllers\ContractController::class, 'suspend'])->name('contracts.suspend');
                Route::post('contracts/{contract}/end', [\App\Http\Controllers\ContractController::class, 'endContract'])->name('contracts.end');
                Route::post('contracts/{contract}/cancel', [\App\Http\Controllers\ContractController::class, 'cancelContract'])->name('contracts.cancel');
                Route::delete('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'destroy'])->name('contracts.destroy');

                Route::post('contracts/{contract}/periods', [\App\Http\Controllers\ContractController::class, 'addPeriod'])->name('contracts.periods.store');
                Route::patch('contracts/{contract}/periods/{period}', [\App\Http\Controllers\ContractController::class, 'updatePeriod'])->name('contracts.periods.update');
                Route::patch('contracts/{contract}/periods/{period}/items', [\App\Http\Controllers\ContractController::class, 'updatePeriodItems'])->name('contracts.periods.items.update');
                Route::patch('contracts/{contract}/periods/{period}/status', [\App\Http\Controllers\ContractController::class, 'updatePeriodStatus'])->name('contracts.periods.status');
                Route::delete('contracts/{contract}/periods/{period}', [\App\Http\Controllers\ContractController::class, 'destroyPeriod'])->name('contracts.periods.destroy');
                Route::post('contracts/{contract}/contacts', [\App\Http\Controllers\ContractController::class, 'addContact'])->name('contracts.contacts.store');
                Route::patch('contracts/{contract}/contacts/{contractContact}/status', [\App\Http\Controllers\ContractController::class, 'updateContactStatus'])->name('contracts.contacts.status');

                Route::post('contracts/{contract}/invoices', [\App\Http\Controllers\ContractController::class, 'storeInvoice'])->name('contracts.invoices.store');
                Route::post('contracts/{contract}/payments', [\App\Http\Controllers\ContractController::class, 'storePayment'])->name('contracts.payments.store');
                Route::get('contracts/{contract}/vouchers', [\App\Http\Controllers\ContractController::class, 'getVouchers'])->name('contracts.vouchers');
                Route::post('contracts/{contract}/vouchers/bulk-approve', [\App\Http\Controllers\ContractController::class, 'bulkApproveVouchers'])->name('contracts.vouchers.bulk-approve');
                Route::post('contracts/{contract}/vouchers/bulk-reopen', [\App\Http\Controllers\ContractController::class, 'bulkReopenVouchers'])->name('contracts.vouchers.bulk-reopen');
                Route::get('contracts/{contract}/vouchers/bulk-print', [\App\Http\Controllers\ContractController::class, 'bulkPrintVouchers'])->name('contracts.vouchers.bulk-print');
                Route::get('contracts/{contract}/pallets', [\App\Http\Controllers\ContractController::class, 'getPallets'])->name('contracts.pallets');
                Route::get('contracts/{contract}/stored-items', [\App\Http\Controllers\ContractController::class, 'getStoredItems'])->name('contracts.stored-items');
                Route::get('contracts/{contract}/item-movements', [\App\Http\Controllers\ContractController::class, 'getItemMovements'])->name('contracts.item-movements');
                Route::get('contracts/{contract}/pallet-movements', [\App\Http\Controllers\ContractController::class, 'getPalletMovements'])->name('contracts.pallet-movements');

                // Agents
                Route::get('agents', [\App\Http\Controllers\AgentController::class, 'index'])->name('agents.index');
                Route::post('agents', [\App\Http\Controllers\AgentController::class, 'store'])->name('agents.store');

                // Season-term assignment
                Route::get('seasons/{season}/terms', [\App\Http\Controllers\TermController::class, 'seasonTerms'])->name('seasons.terms.index');
                Route::post('seasons/{season}/terms/sync', [\App\Http\Controllers\TermController::class, 'syncSeasonTerms'])->name('seasons.terms.sync');
                Route::post('seasons/{season}/terms/reorder', [\App\Http\Controllers\TermController::class, 'reorderSeasonTerms'])->name('seasons.terms.reorder');
                // Drivers API
                Route::get('api/drivers', [\App\Http\Controllers\DriverController::class, 'index'])->name('api.drivers.index');
                Route::post('api/drivers', [\App\Http\Controllers\DriverController::class, 'store'])->name('api.drivers.store');

                // Receptions Vouchers
                Route::post('receptions/{reception}/approve', [\App\Http\Controllers\ReceptionController::class, 'approve'])->name('receptions.approve');
                Route::post('receptions/{reception}/reopen', [\App\Http\Controllers\ReceptionController::class, 'reopen'])->name('receptions.reopen');
                Route::get('receptions/{reception}/print', [\App\Http\Controllers\ReceptionController::class, 'print'])->name('receptions.print');
                Route::resource('receptions', \App\Http\Controllers\ReceptionController::class);

                // Exit Authorizations
                Route::resource('exit-authorizations', \App\Http\Controllers\ExitAuthorizationController::class);

                // Deliveries
                Route::post('deliveries/{delivery}/approve', [\App\Http\Controllers\DeliveryController::class, 'approve'])->name('deliveries.approve');
                Route::post('deliveries/{delivery}/reopen', [\App\Http\Controllers\DeliveryController::class, 'reopen'])->name('deliveries.reopen');
                Route::get('deliveries/{delivery}/print', [\App\Http\Controllers\DeliveryController::class, 'print'])->name('deliveries.print');
                Route::resource('deliveries', \App\Http\Controllers\DeliveryController::class);

                // Progressive Loading API routes for Deliveries
                Route::get('api/contracts/{contract}/pallets', [\App\Http\Controllers\DeliveryController::class, 'getContractPallets'])->name('api.contracts.pallets');
                Route::get('api/contracts/{contract}/pallets/{pallet}/items', [\App\Http\Controllers\DeliveryController::class, 'getPalletItems'])->name('api.contracts.pallets.items');
                Route::get('api/contracts/{contract}/pallets/{pallet}/items/{item}/variants', [\App\Http\Controllers\DeliveryController::class, 'getItemVariants'])->name('api.contracts.pallets.items.variants');

                // Settings Sub-module
                Route::prefix('settings')->name('settings.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\SettingsController::class, 'index'])->name('index');

                    Route::get('general', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'index'])->name('general.index');
                    Route::post('general', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'store'])->name('general.store');
                    Route::post('general/files', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'uploadFile'])->name('general.files.upload');
                    Route::delete('general/files/{id}', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'deleteFile'])->name('general.files.destroy');

                    Route::post('countries/seed', [\App\Http\Controllers\Settings\CountryController::class, 'seed'])->name('countries.seed');
                    Route::resource('countries', \App\Http\Controllers\Settings\CountryController::class)->except(['show', 'create', 'edit']);
                    Route::resource('categories', \App\Http\Controllers\Settings\CustomerCategoryController::class)->except(['show', 'create', 'edit']);
                    Route::resource('inventory-categories', \App\Http\Controllers\Settings\InventoryCategoryController::class)->parameters(['inventory-categories' => 'inventory_category'])->except(['show', 'create', 'edit']);
                    Route::resource('storage-items', \App\Http\Controllers\Settings\StorageItemController::class)->parameters(['storage-items' => 'storage_item'])->except(['show', 'create', 'edit']);
                    Route::post('terms/settings', [\App\Http\Controllers\Settings\TermController::class, 'updateSettings'])->name('terms.settings.update');
                    Route::resource('terms', \App\Http\Controllers\Settings\TermController::class)->except(['show', 'create', 'edit']);
                    Route::put('terms/blocks/{block}', [\App\Http\Controllers\Settings\TermController::class, 'updateBlock'])->name('terms.blocks.update');
                    Route::resource('seasons', \App\Http\Controllers\Settings\SeasonController::class)->except(['create', 'edit']);
                    Route::put('seasons/{season}/blocks/{block}', [\App\Http\Controllers\Settings\SeasonController::class, 'updateBlock'])->name('seasons.blocks.update');
                });
            });
        });
    });
});
