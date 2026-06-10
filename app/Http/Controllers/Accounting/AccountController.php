<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index()
    {
        $accounts = Account::with('children')->whereNull('parent_id')->orderBy('code')->get();
        // Since we want the full tree, we might need a recursive loading or we can just load all and build tree in frontend
        $allAccounts = Account::orderBy('code')->get();
        
        return Inertia::render('Accounting/ChartOfAccounts/Index', [
            'accounts' => $allAccounts
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:accounts,id',
            'code' => 'required|string|unique:accounts,code',
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'normal_balance' => 'required|in:debit,credit',
            'is_transactional' => 'boolean',
            'is_active' => 'boolean',
            'description' => 'nullable|string'
        ]);

        Account::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الحساب بنجاح');
    }

    public function update(Request $request, Account $account)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:accounts,id',
            'code' => 'required|string|unique:accounts,code,' . $account->id,
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'normal_balance' => 'required|in:debit,credit',
            'is_transactional' => 'boolean',
            'is_active' => 'boolean',
            'description' => 'nullable|string'
        ]);

        $account->update($validated);

        return redirect()->back()->with('success', 'تم تعديل الحساب بنجاح');
    }

    public function destroy(Account $account)
    {
        if ($account->children()->count() > 0) {
            return redirect()->back()->with('error', 'لا يمكن حذف حساب رئيسي يحتوي على حسابات فرعية');
        }

        if ($account->journalLines()->count() > 0) {
            return redirect()->back()->with('error', 'لا يمكن حذف حساب يحتوي على حركات مالية');
        }

        $account->delete();

        return redirect()->back()->with('success', 'تم حذف الحساب بنجاح');
    }
}
