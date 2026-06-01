<?php

namespace App\Http\Controllers;

use App\Models\Pallet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class PalletController extends Controller
{
    public function index(Request $request)
    {
        $query = Pallet::query();

        // Filters
        if ($request->filled('size')) {
            $query->where('size', $request->size);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('pallet_number', 'like', "%{$search}%")
                  ->orWhere('pallet_code', 'like', "%{$search}%");
            });
        }

        $pallets = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Pallets/Index', [
            'pallets' => $pallets,
            'filters' => $request->only(['size', 'search'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pallet_number' => 'required|string|max:50',
            'size'          => 'required|string|in:كبيرة,وسط,صغيرة,خشب,بلاستيك',
        ]);

        // Generate and verify unique pallet_code
        $sizeCodes = [
            'كبيرة' => '01',
            'وسط' => '02',
            'صغيرة' => '03',
            'خشب' => '04',
            'بلاستيك' => '05',
        ];
        $code = $sizeCodes[$request->size] ?? '02';
        $num = str_pad((string)$request->pallet_number, 5, '0', STR_PAD_LEFT);
        $palletCode = 'PAL' . $code . $num;

        $exists = Pallet::where('pallet_code', $palletCode)->exists();
        if ($exists) {
            return redirect()->back()->withErrors([
                'pallet_number' => 'كود الطبلية الناتج (' . $palletCode . ') مستخدم بالفعل.'
            ])->withInput();
        }

        Pallet::create($validated);

        return redirect()->back()->with('success', 'تم إنشاء الطبلية بنجاح.');
    }

    public function update(Request $request, Pallet $pallet)
    {
        $validated = $request->validate([
            'pallet_number' => 'required|string|max:50',
            'size'          => 'required|string|in:كبيرة,وسط,صغيرة,خشب,بلاستيك',
        ]);

        // Generate and verify unique pallet_code excluding current pallet
        $sizeCodes = [
            'كبيرة' => '01',
            'وسط' => '02',
            'صغيرة' => '03',
            'خشب' => '04',
            'بلاستيك' => '05',
        ];
        $code = $sizeCodes[$request->size] ?? '02';
        $num = str_pad((string)$request->pallet_number, 5, '0', STR_PAD_LEFT);
        $palletCode = 'PAL' . $code . $num;

        $exists = Pallet::where('pallet_code', $palletCode)
            ->where('id', '!=', $pallet->id)
            ->exists();
            
        if ($exists) {
            return redirect()->back()->withErrors([
                'pallet_number' => 'كود الطبلية الناتج (' . $palletCode . ') مستخدم بالفعل.'
            ])->withInput();
        }

        $pallet->update($validated);

        return redirect()->back()->with('success', 'تم تحديث بيانات الطبلية بنجاح.');
    }

    public function destroy(Request $request, Pallet $pallet)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = auth()->user();
        if (empty($user->secure_password)) {
            return redirect()->back()->with('error', 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.');
        }

        if (!Hash::check($request->password, $user->secure_password)) {
            return redirect()->back()->with('error', 'كلمة مرور تأكيد الحذف غير صحيحة.');
        }

        // Verify if pallet has active inventory entries
        $hasEntries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)->exists();
        if ($hasEntries) {
            return redirect()->back()->with('error', 'لا يمكن حذف طبلية مسجل عليها حركات مخزون. يرجى تصفير الحركات أولاً.');
        }

        $pallet->delete();

        return redirect()->back()->with('success', 'تم حذف الطبلية بنجاح.');
    }

    public function lookup(Request $request)
    {
        $request->validate([
            'pallet_number' => 'required|string|max:50',
        ]);

        $code = trim($request->pallet_number);
        $pallet = Pallet::findOrCreateFromCode($code);

        return response()->json([
            'id' => $pallet->id,
            'pallet_number' => $pallet->pallet_number,
            'pallet_code' => $pallet->pallet_code,
            'size' => $pallet->size,
        ]);
    }
}
