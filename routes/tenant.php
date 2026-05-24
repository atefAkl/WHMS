<?php

declare(strict_types=1);

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    Route::get('/', function () {
        return redirect()->route('dashboard');
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

                Route::get('/pallets', [\App\Http\Controllers\PalletController::class, 'index'])->name('pallets.index');
                Route::resource('customers', \App\Http\Controllers\CustomerController::class)->except(['create', 'edit']);
                Route::post('customers/{customer}/contacts', [\App\Http\Controllers\ContactController::class, 'store'])->name('customers.contacts.store');
                Route::put('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'update'])->name('customers.contacts.update');
                Route::delete('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'destroy'])->name('customers.contacts.destroy');

                // Contracts
                Route::get('contracts/create', [\App\Http\Controllers\ContractController::class, 'create'])->name('contracts.create');
                Route::post('contracts', [\App\Http\Controllers\ContractController::class, 'store'])->name('contracts.store');
                Route::get('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'show'])->name('contracts.show');
                Route::post('contracts/{contract}/activate', [\App\Http\Controllers\ContractController::class, 'activate'])->name('contracts.activate');
                Route::post('contracts/{contract}/suspend', [\App\Http\Controllers\ContractController::class, 'suspend'])->name('contracts.suspend');
                Route::post('contracts/{contract}/end', [\App\Http\Controllers\ContractController::class, 'endContract'])->name('contracts.end');
                Route::post('contracts/{contract}/cancel', [\App\Http\Controllers\ContractController::class, 'cancelContract'])->name('contracts.cancel');
                Route::delete('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'destroy'])->name('contracts.destroy');

                Route::post('contracts/{contract}/periods', [\App\Http\Controllers\ContractController::class, 'addPeriod'])->name('contracts.periods.store');
                Route::post('contracts/{contract}/contacts', [\App\Http\Controllers\ContractController::class, 'addContact'])->name('contracts.contacts.store');
                Route::patch('contracts/{contract}/contacts/{contractContact}/status', [\App\Http\Controllers\ContractController::class, 'updateContactStatus'])->name('contracts.contacts.status');

                Route::post('contracts/{contract}/invoices', [\App\Http\Controllers\ContractController::class, 'storeInvoice'])->name('contracts.invoices.store');
                Route::post('contracts/{contract}/payments', [\App\Http\Controllers\ContractController::class, 'storePayment'])->name('contracts.payments.store');

                // Agents
                Route::get('agents', [\App\Http\Controllers\AgentController::class, 'index'])->name('agents.index');
                Route::post('agents', [\App\Http\Controllers\AgentController::class, 'store'])->name('agents.store');

                // Season-term assignment
                Route::get('seasons/{season}/terms', [\App\Http\Controllers\TermController::class, 'seasonTerms'])->name('seasons.terms.index');
                Route::post('seasons/{season}/terms/sync', [\App\Http\Controllers\TermController::class, 'syncSeasonTerms'])->name('seasons.terms.sync');
                Route::post('seasons/{season}/terms/reorder', [\App\Http\Controllers\TermController::class, 'reorderSeasonTerms'])->name('seasons.terms.reorder');

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
                    Route::resource('storage-items', \App\Http\Controllers\Settings\StorageItemController::class)->parameters(['storage-items' => 'storage_item'])->except(['show', 'create', 'edit']);
                    Route::post('terms/settings', [\App\Http\Controllers\Settings\TermController::class, 'updateSettings'])->name('terms.settings.update');
                    Route::resource('terms', \App\Http\Controllers\Settings\TermController::class)->except(['show', 'create', 'edit']);
                    Route::resource('seasons', \App\Http\Controllers\Settings\SeasonController::class)->except(['create', 'edit']);
                });
            });
        });
    });
});
