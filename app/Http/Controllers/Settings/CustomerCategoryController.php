<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CustomerCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerCategoryController extends Controller
{
    public function index(Request $request)
    {
        // Load with parent relationship to build tree/hierarchy
        $categories = CustomerCategory::with('parent')->latest()->paginate(15);
        $parentCategories = CustomerCategory::whereNull('parent_id')->get();

        return Inertia::render('Settings/Categories', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:customer_categories,id',
        ]);

        CustomerCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, CustomerCategory $category)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:customer_categories,id',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroy(CustomerCategory $category)
    {
        // Check if has children or customers before deleting
        if ($category->children()->count() > 0) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete a parent category with sub-categories.']);
        }
        
        $category->delete();
        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}
