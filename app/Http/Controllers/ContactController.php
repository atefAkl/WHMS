<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contact;
use App\Models\Customer;

use App\Traits\ApiResponse;

class ContactController extends Controller
{
    use ApiResponse;

    public function store(Request $request, string $customerId)
    {
        $customer = Customer::findOrFail($customerId);

        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'phone_number'       => 'required|string|max:20',
            'id_number'          => 'nullable|string|max:50',
            'job_title'          => 'nullable|string|max:255',
            'can_sign'           => 'boolean',
            'can_withdraw_goods' => 'boolean',
        ]);

        $contact = $customer->contacts()->create($validated);

        if (($request->wantsJson() || $request->ajax()) && !$request->header('X-Inertia')) {
            return $this->successResponse([
                'contact' => $contact
            ], 'تم إضافة جهة الاتصال بنجاح.');
        }

        return redirect()->back()->with('success', 'تم إضافة جهة الاتصال.');
    }

    public function update(Request $request, string $customerId, string $contactId)
    {
        $contact = Contact::where('customer_id', $customerId)->findOrFail($contactId);

        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'phone_number'       => 'required|string|max:20',
            'id_number'          => 'nullable|string|max:50',
            'job_title'          => 'nullable|string|max:255',
            'can_sign'           => 'boolean',
            'can_withdraw_goods' => 'boolean',
        ]);

        $contact->update($validated);

        return redirect()->back()->with('success', 'تم تحديث جهة الاتصال.');
    }

    public function destroy(string $customerId, string $contactId)
    {
        $contact = Contact::where('customer_id', $customerId)->findOrFail($contactId);
        $contact->delete();

        return redirect()->back()->with('success', 'تم حذف جهة الاتصال.');
    }
}
