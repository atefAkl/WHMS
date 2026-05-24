<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TenantPasswordSetupController extends Controller
{
    public function show(Request $request)
    {
        $token = $request->query('token');

        if (!$token) {
            return Inertia::render('Tenant/SetupPassword', [
                'error' => 'رابط التنشيط هذا غير صالح أو منتهي الصلاحية.'
            ]);
        }

        $user = User::where('setup_token', $token)->first();

        if (!$user) {
            return Inertia::render('Tenant/SetupPassword', [
                'error' => 'رابط التنشيط هذا غير صالح أو منتهي الصلاحية.'
            ]);
        }

        return Inertia::render('Tenant/SetupPassword', [
            'token' => $token,
            'email' => $user->email,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'username' => 'required|string|min:3|unique:users,username',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::where('setup_token', $validated['token'])->first();

        if (!$user) {
            return back()->withErrors(['token' => 'رابط التنشيط غير صالح أو منتهي الصلاحية.']);
        }

        $user->update([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'setup_token' => null,
        ]);

        Auth::login($user);

        return redirect()->route('tenant.setup')->with('success', 'تم تعيين كلمة المرور بنجاح. يرجى إكمال إعداد بيانات المنشأة.');
    }
}
