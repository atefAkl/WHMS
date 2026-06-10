<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CustomerCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Traits\ValidatesSecureDeletion;

class CustomerCategoryController extends Controller
{
    use ValidatesSecureDeletion;
    public function index(Request $request)
    {
        // Load with parent relationship to build tree/hierarchy
        $categories = CustomerCategory::with('parent')->latest()->paginate(15);
        $parentCategories = CustomerCategory::whereNull('parent_id')->get();

        $accounts = \App\Models\Account::where('is_transactional', true)
            ->where(function ($query) {
                $query->where('code', 'like', '1103%')
                      ->orWhere('code', 'like', '2101%');
            })
            ->get();

        return Inertia::render('Settings/Categories', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:customer_categories,id',
            'account_id' => 'nullable|exists:accounts,id',
            'account_id' => 'nullable|exists:accounts,id',
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
            'account_id' => 'nullable|exists:accounts,id',
            'account_id' => 'nullable|exists:accounts,id',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Request $request, CustomerCategory $category)
    {
        $this->validateSecureDelete($request);

        // Check if has children or customers before deleting
        if ($category->children()->count() > 0) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete a parent category with sub-categories.']);
        }
        
        $category->delete();
        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}
