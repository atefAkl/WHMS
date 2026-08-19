<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\ValidatesSecureDeletion;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        \App\Models\ActivityLog::log(
            'تسجيل دخول ناجح إلى النظام',
            'login',
            Auth::user(),
            null,
            null,
            Auth::user()->name ?? Auth::user()->username
        );

        $redirectRoute = in_array($request->getHost(), config('tenancy.central_domains', [])) 
            ? route('saas.tenants.index', absolute: false) 
            : route('dashboard', absolute: false);

        $intendedUrl = $request->input('redirect_to') ?: session()->pull('url.intended');
        if ($intendedUrl && !str_contains($intendedUrl, '/login')) {
            return redirect()->to($intendedUrl);
        }

        return redirect()->intended($redirectRoute);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if ($user) {
            \App\Models\ActivityLog::log(
                'تسجيل خروج من النظام',
                'logout',
                $user,
                null,
                null,
                $user->name ?? $user->username
            );
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
