<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\StorageItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Traits\ValidatesSecureDeletion;

class StorageItemController extends Controller
{
    use ValidatesSecureDeletion;
    public function index()
    {
        $items = StorageItem::latest()->get();
        return Inertia::render('Settings/StorageItems', compact('items'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar'       => 'required|string|max:255',
            'name_en'       => 'nullable|string|max:255',
            'default_price' => 'required|numeric|min:0',
            'is_active'     => 'boolean',
        ]);

        StorageItem::create($validated);

        return redirect()->back()->with('success', 'تم إضافة وحدة التخزين بنجاح.');
    }

    public function update(Request $request, StorageItem $storage_item)
    {
        $validated = $request->validate([
            'name_ar'       => 'required|string|max:255',
            'name_en'       => 'nullable|string|max:255',
            'default_price' => 'required|numeric|min:0',
            'is_active'     => 'boolean',
        ]);

        $storage_item->update($validated);

        return redirect()->back()->with('success', 'تم تحديث وحدة التخزين بنجاح.');
    }

    public function destroy(Request $request, StorageItem $storage_item)
    {
        $this->validateSecureDelete($request);
        
        if ($storage_item->id <= 2) {
            return redirect()->back()->with('error', 'لا يمكن حذف الوحدات الأساسية.');
        }
        $storage_item->delete();
        return redirect()->back()->with('success', 'تم حذف وحدة التخزين.');
    }
}
