<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Season;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Term;

class SeasonController extends Controller
{
    public function index(Request $request)
    {
        $seasons = Season::latest()->get();
        $openCreate = $request->boolean('create');

        return Inertia::render('Settings/Seasons/Index', compact('seasons', 'openCreate'));
    }

    public function show(Season $season)
    {
        $allTerms = Term::orderBy('sort_order')->get();
        $season->load(['terms' => function($q) {
            $q->orderBy('season_terms.sort_order');
        }]);
        
        return Inertia::render('Settings/Seasons/Show', [
            'season' => $season,
            'allTerms' => $allTerms
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar'    => 'required|string|max:255',
            'name_en'    => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'is_active'  => 'boolean',
        ]);

        Season::create($validated);

        if (!session()->has('active_season_id')) {
            return redirect()->route('season.select')->with('success', ' „ ≈÷«›… «·„Ê”„ »‰Ã«Õ. «Œ — «·„Ê”„ ··„ «»⁄….');
        }

        return redirect()->back()->with('success', ' „ ≈÷«›… «·„Ê”„ »‰Ã«Õ.');
    }

    public function update(Request $request, Season $season)
    {
        $validated = $request->validate([
            'name_ar'          => 'required|string|max:255',
            'name_en'          => 'nullable|string|max:255',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'is_active'        => 'boolean',
            'introduction'     => 'nullable|string',
            'preamble'         => 'nullable|string',
            'mandatory_period' => 'integer|min:0',
            'renewal_period'   => 'integer|min:0',
        ]);

        $season->update($validated);

        return redirect()->back()->with('success', ' „  ÕœÌÀ «·„Ê”„ »‰Ã«Õ.');
    }

    public function destroy(Season $season)
    {
        $season->delete();
        return redirect()->back()->with('success', ' „ Õ–› «·„Ê”„.');
    }
}