<?php

namespace App\Http\Controllers;

use App\Models\Season;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SeasonSelectionController extends Controller
{
    public function create()
    {
        $seasons = Season::where('is_active', true)->latest()->get();
        return Inertia::render('Auth/SelectSeason', compact('seasons'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'season_id' => 'required|exists:seasons,id'
        ]);

        $season = Season::findOrFail($request->season_id);

        if (!$season->is_active) {
            return back()->withErrors(['season_id' => 'هذا الموسم مغلق أو غير نشط.']);
        }

        session(['active_season_id' => $season->id]);
        session(['active_season_name' => $season->name_ar]);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
