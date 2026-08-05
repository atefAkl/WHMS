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
        $user = $request->user();

        $avatarFiles = [];
        $avatarDir = public_path('uploads/avatars');
        if (file_exists($avatarDir)) {
            $files = glob($avatarDir . '/*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE);
            if ($files) {
                foreach ($files as $file) {
                    $avatarFiles[] = '/uploads/avatars/' . basename($file);
                }
            }
        }
        $gallery = array_values(array_unique(array_filter(array_merge(
            $avatarFiles,
            \App\Models\User::whereNotNull('avatar')->pluck('avatar')->toArray(),
            \App\Models\Employee::whereNotNull('avatar')->pluck('avatar')->toArray()
        ))));

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'avatarGallery' => $gallery,
            'assignedRoles' => $user->roles->pluck('name')->toArray(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $avatarPath = $user->avatar;
        if ($request->has('avatar_gallery')) {
            $avatarPath = $request->input('avatar_gallery');
        }
        if ($request->hasFile('avatar')) {
            if ($user->avatar && file_exists(public_path($user->avatar))) {
                @unlink(public_path($user->avatar));
            }
            $file = $request->file('avatar');
            $filename = time() . '_avatar_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/avatars'), $filename);
            $avatarPath = '/uploads/avatars/' . $filename;
        }

        $updateData = [];
        $fields = ['name', 'email', 'phone', 'id_number', 'job_title'];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $validated[$field];
            }
        }
        $updateData['avatar'] = $avatarPath;

        $user->fill($updateData);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit')->with('success', 'تم تحديث البيانات بنجاح.');
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
