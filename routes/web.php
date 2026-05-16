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

        Route::middleware('auth')->group(function () {
            Route::get('/profile', [ProfileController::class, 'edit'])->name('central.profile.edit');
            Route::patch('/profile', [ProfileController::class, 'update'])->name('central.profile.update');
            Route::delete('/profile', [ProfileController::class, 'destroy'])->name('central.profile.destroy');

            // Central SaaS Management Dashboard
            Route::get('/saas/tenants', [\App\Http\Controllers\SaaSController::class, 'index'])->name('saas.tenants.index');
        });

        require __DIR__.'/auth.php';
    });
}
