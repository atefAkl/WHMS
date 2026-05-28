<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryCategoryController extends Controller
{
    public function index()
    {
        $categories = InventoryCategory::with('parent')->latest()->get();
        return Inertia::render('Settings/InventoryCategories', compact('categories'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|exists:inventory_categories,id',
            'is_active' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        InventoryCategory::create($validated);

        return redirect()->back()->with('success', 'تم إضافة فئة الأصناف بنجاح.');
    }

    public function update(Request $request, InventoryCategory $inventory_category)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|exists:inventory_categories,id',
            'is_active' => 'boolean',
        ]);

        $validated['updated_by'] = auth()->id();

        $inventory_category->update($validated);

        return redirect()->back()->with('success', 'تم تحديث فئة الأصناف بنجاح.');
    }

    public function destroy(InventoryCategory $inventory_category)
    {
        if ($inventory_category->children()->count() > 0) {
            return redirect()->back()->with('error', 'لا يمكن حذف الفئة لأنها تحتوي على فئات فرعية.');
        }

        if ($inventory_category->inventoryItems()->count() > 0) {
            return redirect()->back()->with('error', 'لا يمكن حذف الفئة لأنها تحتوي على أصناف مخزنية مرتبطة بها.');
        }

        $inventory_category->delete();

        return redirect()->back()->with('success', 'تم حذف فئة الأصناف بنجاح.');
    }
}
