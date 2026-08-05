<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException;
use Inertia\Inertia;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Handle the incoming request and set the application locale.
     */
    public function handle(Request $request, \Closure $next)
    {
        $locale = $request->cookie('wms_locale', 'ar');
        if (in_array($locale, ['ar', 'en'])) {
            app()->setLocale($locale);
        }

        try {
            return parent::handle($request, $next);
        } catch (TenantCouldNotBeIdentifiedOnDomainException $e) {
            // Show a friendly Inertia page instead of an exception dump
            $msg = $e->getMessage();
            // extract domain from message if possible
            preg_match('/domain\s+(\S+)/', $msg, $m);
            $domain = $m[1] ?? null;

            return Inertia::render('Errors/TenantNotFound', ['domain' => $domain])->toResponse($request)->setStatusCode(404);
        }
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = app()->getLocale();
        $translations = [];
        $langPath = function_exists('lang_path') ? lang_path($locale) : base_path("lang/{$locale}");
        if (file_exists($langPath)) {
            foreach (glob($langPath . '/*.php') as $file) {
                $name = basename($file, '.php');
                $translations[$name] = require $file;
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'active_season_name' => session('active_season_name'),
                'permissions' => $request->user() ? $request->user()->getPermissions() : [],
                'unread_notifications_count' => ($request->user() && \Illuminate\Support\Facades\Schema::hasTable('notifications')) ? $request->user()->unreadNotifications()->count() : 0,
            ],
            'flash' => [
                'success'      => fn() => $request->session()->get('success'),
                'error'        => fn() => $request->session()->get('error'),
                'warning'      => fn() => $request->session()->get('warning'),
                'info'         => fn() => $request->session()->get('info'),
                'mail_warning' => fn() => $request->session()->get('mail_warning'),
            ],
            'translations' => $translations,
            'locale' => $locale,
        ];
    }
}
