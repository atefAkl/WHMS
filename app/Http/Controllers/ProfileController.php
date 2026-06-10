<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\ValidatesSecureDeletion;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Update the user's UI preferences.
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
        ]);

        $user = $request->user();
        $current = $user->preferences ?? [];
        $user->preferences = array_merge($current, $validated['preferences']);
        $user->save();

        return back();
    }

    /**
     * Update the user's secure deletion password.
     */
    public function updateSecurePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'secure_password' => 'required|string|min:4|confirmed',
        ]);

        $user = $request->user();
        $user->secure_password = \Hash::make($validated['secure_password']);
        $user->save();

        return Redirect::route('profile.edit')->with('status', 'secure-password-updated');
    }
}
