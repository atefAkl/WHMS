<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Term;
use App\Models\Season;
use App\Traits\ApiResponse;

class TermController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $terms = Term::orderBy('sort_order')->orderBy('id')->get();
        return Inertia::render('Settings/Terms', compact('terms'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'text_ar'       => 'required|string',
            'text_en'       => 'nullable|string',
            'has_variables' => 'boolean',
            'is_active'     => 'boolean',
        ]);
        $validated['sort_order'] = Term::max('sort_order') + 1;
        $term = Term::create($validated);
        return $this->successResponse($term, 'Term created successfully', 201);
    }

    public function update(Request $request, Term $term)
    {
        $validated = $request->validate([
            'text_ar'       => 'required|string',
            'text_en'       => 'nullable|string',
            'has_variables' => 'boolean',
            'is_active'     => 'boolean',
        ]);
        $term->update($validated);
        return $this->successResponse($term, 'Term updated successfully');
    }

    public function destroy(Term $term)
    {
        $term->delete();
        return $this->successResponse(null, 'Term deleted successfully');
    }

    /**
     * Reorder global terms library.
     * Body: { ordered_ids: [3,1,5,2,...] }
     */
    public function reorder(Request $request)
    {
        $request->validate(['ordered_ids' => 'required|array', 'ordered_ids.*' => 'integer']);
        foreach ($request->ordered_ids as $index => $id) {
            Term::where('id', $id)->update(['sort_order' => $index]);
        }
        return $this->successResponse(null, 'Terms reordered successfully');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Season-level term assignment
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Get terms assigned to a season.
     */
    public function seasonTerms(Season $season)
    {
        return $this->successResponse($season->terms()->get());
    }

    /**
     * Sync terms for a season (replaces all).
     * Body: { term_ids: [1,2,3] }  – in desired order
     */
    public function syncSeasonTerms(Request $request, Season $season)
    {
        $request->validate(['term_ids' => 'required|array', 'term_ids.*' => 'integer|exists:terms,id']);
        $pivot = [];
        foreach ($request->term_ids as $index => $id) {
            $pivot[$id] = ['sort_order' => $index];
        }
        $season->terms()->sync($pivot);
        return $this->successResponse($season->terms()->get(), 'Season terms synced successfully');
    }

    /**
     * Reorder terms within a season.
     * Body: { ordered_ids: [3,1,5,...] }
     */
    public function reorderSeasonTerms(Request $request, Season $season)
    {
        $request->validate(['ordered_ids' => 'required|array', 'ordered_ids.*' => 'integer']);
        foreach ($request->ordered_ids as $index => $id) {
            $season->terms()->updateExistingPivot($id, ['sort_order' => $index]);
        }
        return $this->successResponse(null, 'Season terms reordered successfully');
    }
}
