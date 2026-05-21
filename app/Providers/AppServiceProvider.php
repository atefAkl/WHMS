<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Auth\Middleware\Authenticate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);
        Vite::prefetch(concurrency: 3);

        Authenticate::redirectUsing(function ($request) {
            return $request->expectsJson() ? null : '/login';
        });

        RedirectIfAuthenticated::redirectUsing(function ($request) {
            if (in_array($request->getHost(), config('tenancy.central_domains', []), true)) {
                return '/saas/tenants';
            }

            return '/dashboard';
        });
    }
}
