<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$centralDomains = config('tenancy.central_domains', ['whm.apl', 'www.whm.apl', 'localhost', '127.0.0.1']);

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

        require __DIR__ . '/auth.php';
    });
}
