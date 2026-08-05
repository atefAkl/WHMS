<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: [
            'wms_locale',
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            // تم حذف ميدلوير CORS لأن الدعم مدمج في Laravel 10+
        ]);

        $middleware->alias([
            'season' => \App\Http\Middleware\EnsureSeasonIsSelected::class,
            'tenant' => \App\Http\Middleware\EnsureTenantIsConfigured::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission.check' => \App\Http\Middleware\EnsureUserHasPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Database\QueryException $e, \Illuminate\Http\Request $request) {
            // 23503 is the SQLSTATE code for foreign key violation in PostgreSQL and MySQL
            if (
                $e->getCode() == '23503' || 
                str_contains($e->getMessage(), '23503') || 
                str_contains($e->getMessage(), 'foreign key') || 
                str_contains($e->getMessage(), 'constraint fails')
            ) {
                return back()->with('error', 'لا يمكن حذف هذا السجل لارتباطه ببيانات وسجلات أخرى في النظام.');
            }
        });
    })->create();
