<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Exceptions\HttpResponseException;

trait ValidatesSecureDeletion
{
    /**
     * Validates that the provided password matches the authenticated user's secure_password.
     * Throws an HttpResponseException that redirects back with an error on failure.
     *
     * @param Request $request
     * @return void
     * @throws HttpResponseException
     */
    protected function validateSecureDelete(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (empty($user->secure_password)) {
            throw new HttpResponseException(
                redirect()->back()->with('error', 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.')
            );
        }

        if (!Hash::check($request->password, $user->secure_password)) {
            throw new HttpResponseException(
                redirect()->back()->with('error', 'كلمة مرور تأكيد الحذف غير صحيحة.')
            );
        }
    }
}
