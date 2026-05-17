<?php

namespace App\Http\Controllers;

use App\Models\TenantRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TenantRequestController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:tenant_requests',
            'phone' => 'required|string|max:20',
            'requested_subdomain' => 'required|string|alpha_dash|max:50|unique:tenant_requests|unique:domains,domain',
            'plan' => 'required|string|in:starter,business,enterprise',
        ]);

        try {
            TenantRequest::create($validated);

            return redirect('/register-warehouse/pending?' . http_build_query([
                'email'        => $validated['email'],
                'company_name' => $validated['company_name'],
            ]));
        } catch (\Exception $e) {
            Log::error('Tenant Request Error: ' . $e->getMessage());
            return back()->with('error', 'عذراً، حدث خطأ أثناء إرسال طلبك. يرجى المحاولة لاحقاً.');
        }
    }

    public function pending(Request $request)
    {
        return Inertia::render('RegistrationPending', [
            'email'        => $request->query('email'),
            'company_name' => $request->query('company_name'),
        ]);
    }
}
