<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\StorageItem;
use App\Models\SalesCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Traits\ValidatesSecureDeletion;

class ServiceController extends Controller
{
    use ValidatesSecureDeletion;

    public function index(Request $request)
    {
        $categories = SalesCategory::with('parent')->latest()->get();
        $items = StorageItem::with('salesCategory')->latest()->get();
        
        return Inertia::render('Sales/Services/Index', compact('categories', 'items'));
    }

    public function show($id)
    {
        $service = StorageItem::with('salesCategory')->findOrFail($id);
        $stats = [
            'total_usages' => 0,
            'total_revenue' => 0,
        ];
        
        return Inertia::render('Sales/Services/Show', compact('service', 'stats'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sales_category_id'   => 'nullable|exists:sales_categories,id',
            'code'                => 'nullable|string|max:50',
            'type'                => 'required|in:item,service',
            'name_ar'             => 'required|string|max:255',
            'name_en'             => 'nullable|string|max:255',
            'default_price'       => 'required|numeric|min:0',
            'is_active'           => 'boolean',
            'description_ar'      => 'nullable|string',
        ]);

        StorageItem::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الصنف بنجاح.');
    }

    public function update(Request $request, $id)
    {
        $service = StorageItem::findOrFail($id);
        $validated = $request->validate([
            'sales_category_id'   => 'nullable|exists:sales_categories,id',
            'code'                => 'nullable|string|max:50',
            'type'                => 'required|in:item,service',
            'name_ar'             => 'required|string|max:255',
            'name_en'             => 'nullable|string|max:255',
            'default_price'       => 'required|numeric|min:0',
            'is_active'           => 'boolean',
            'description_ar'      => 'nullable|string',
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الصنف بنجاح.');
    }

    public function destroy(Request $request, $id)
    {
        $this->validateSecureDelete($request);

        $service = StorageItem::findOrFail($id);
        $service->delete();
        return redirect()->back()->with('success', 'تم حذف الصنف بنجاح.');
    }

    // Bulk actions
    public function bulkDestroy(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        $this->validateSecureDelete($request);

        StorageItem::whereIn('id', $request->ids)->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح.');
    }
    
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'is_active' => 'required|boolean'
        ]);
        StorageItem::whereIn('id', $request->ids)->update(['is_active' => $request->is_active]);
        return redirect()->back()->with('success', 'تم تحديث الحالة بنجاح.');
    }

    // Categories Management
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:sales_categories,id',
            'name_ar'   => 'required|string|max:255',
            'name_en'   => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        SalesCategory::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الفئة بنجاح.');
    }

    public function updateCategory(Request $request, $id)
    {
        $category = SalesCategory::findOrFail($id);
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:sales_categories,id|not_in:'.$category->id,
            'name_ar'   => 'required|string|max:255',
            'name_en'   => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الفئة بنجاح.');
    }

    public function destroyCategory(Request $request, $id)
    {
        $this->validateSecureDelete($request);

        $category = SalesCategory::findOrFail($id);
        if ($category->children()->count() > 0 || $category->items()->count() > 0) {
            return redirect()->back()->with('error', 'لا يمكن حذف هذه الفئة لوجود أصناف أو فئات فرعية تابعة لها.');
        }
        $category->delete();
        return redirect()->back()->with('success', 'تم حذف الفئة بنجاح.');
    }
}
