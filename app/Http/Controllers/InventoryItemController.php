<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;

class InventoryItemController extends Controller
{
    public function index()
    {
        $items = InventoryItem::with(['category', 'variants'])->latest()->get();
        $categories = InventoryCategory::with('parent')->latest()->get();
        
        return Inertia::render('InventoryItems/Index', compact('items', 'categories'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'category_id'    => 'nullable|exists:inventory_categories,id',
            'image'          => 'nullable|image|max:2048',
            'is_active'      => 'boolean',
            'variants'       => 'nullable|array',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.quality' => 'nullable|string|max:255',
            'variants.*.default_price' => 'required|numeric|min:0',
            'variants.*.is_active' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_inv_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/inventory_items'), $filename);
            $validated['image'] = '/uploads/inventory_items/' . $filename;
        }

        $item = InventoryItem::create($validated);

        if (!empty($request->variants)) {
            foreach ($request->variants as $v) {
                $item->variants()->create([
                    'name'          => $v['name'],
                    'quality'       => $v['quality'] ?? null,
                    'default_price' => $v['default_price'],
                    'is_active'     => $v['is_active'] ?? true,
                    'created_by'    => auth()->id(),
                    'updated_by'    => auth()->id(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'تم إضافة الصنف المخزني بنجاح.');
    }

    public function show(InventoryItem $inventory_item)
    {
        $inventory_item->load(['category', 'variants']);
        return Inertia::render('InventoryItems/Show', [
            'item' => $inventory_item
        ]);
    }

    public function update(Request $request, InventoryItem $inventory_item)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'category_id'    => 'nullable|exists:inventory_categories,id',
            'image_file'     => 'nullable|image|max:2048',
            'is_active'      => 'boolean',
            'variants'       => 'nullable|array',
            'variants.*.id'  => 'nullable|integer',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.quality' => 'nullable|string|max:255',
            'variants.*.default_price' => 'required|numeric|min:0',
            'variants.*.is_active' => 'boolean',
        ]);

        $validated['updated_by'] = auth()->id();

        $imageKey = $request->hasFile('image_file') ? 'image_file' : ($request->hasFile('image') ? 'image' : null);
        if ($imageKey) {
            if (!empty($inventory_item->image) && File::exists(public_path($inventory_item->image))) {
                File::delete(public_path($inventory_item->image));
            }
            $file = $request->file($imageKey);
            $filename = time() . '_inv_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/inventory_items'), $filename);
            $validated['image'] = '/uploads/inventory_items/' . $filename;
        }

        $inventory_item->update($validated);

        $variantIds = [];
        if (!empty($request->variants)) {
            foreach ($request->variants as $v) {
                $variantData = [
                    'name'          => $v['name'],
                    'quality'       => $v['quality'] ?? null,
                    'default_price' => $v['default_price'],
                    'is_active'     => $v['is_active'] ?? true,
                    'updated_by'    => auth()->id(),
                ];

                if (empty($v['id'])) {
                    $variantData['created_by'] = auth()->id();
                    $newVariant = $inventory_item->variants()->create($variantData);
                    $variantIds[] = $newVariant->id;
                } else {
                    $variant = $inventory_item->variants()->find($v['id']);
                    if ($variant) {
                        $variant->update($variantData);
                        $variantIds[] = $variant->id;
                    }
                }
            }
        }
        
        $inventory_item->variants()->whereNotIn('id', $variantIds)->delete();

        return redirect()->back()->with('success', 'تم تحديث الصنف المخزني بنجاح.');
    }

    public function destroy(Request $request, InventoryItem $inventory_item)
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

        if (!empty($inventory_item->image) && File::exists(public_path($inventory_item->image))) {
            File::delete(public_path($inventory_item->image));
        }

        $inventory_item->delete();

        return redirect()->back()->with('success', 'تم حذف الصنف المخزني بنجاح.');
    }

    public function updateVariant(Request $request, \App\Models\InventoryItemVariant $variant)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'quality'       => 'nullable|string|max:255',
            'default_price' => 'required|numeric|min:0',
            'is_active'     => 'required|boolean',
        ]);

        $variant->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الشكل بنجاح.');
    }
}
