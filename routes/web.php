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

            // Central SaaS Management Dashboard
            Route::get('/saas/tenants', [\App\Http\Controllers\SaaSController::class, 'index'])->name('saas.tenants.index');
            Route::post('/saas/tenants/{tenantRequest}/approve', [\App\Http\Controllers\SaaSController::class, 'approveRequest'])->name('saas.tenants.approve');
            Route::post('/saas/tenants/{tenantRequest}/reject', [\App\Http\Controllers\SaaSController::class, 'rejectRequest'])->name('saas.tenants.reject');
        });

        require __DIR__ . '/auth.php';
    });
}
