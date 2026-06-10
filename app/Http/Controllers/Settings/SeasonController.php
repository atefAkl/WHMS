<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Season;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Term;
use App\Traits\ValidatesSecureDeletion;

class SeasonController extends Controller
{
    use ValidatesSecureDeletion;
    public function index(Request $request)
    {
        $seasons = Season::latest()->get();
        $openCreate = $request->boolean('create');

        return Inertia::render('Settings/Seasons/Index', compact('seasons', 'openCreate'));
    }

    public function show(Season $season)
    {
        $allTerms = Term::whereNull('season_id')->whereNull('contract_id')->orderBy('sort_order')->get();
        $season->load(['terms' => function ($q) {
            $q->orderBy('sort_order');
        }, 'blocks' => function ($q) {
            $q->orderBy('sort_order');
        }]);

        $globalSettings = \App\Models\ContractSetting::whereNull('season_id')->pluck('value', 'key')->all();
        $seasonSettings = \App\Models\ContractSetting::where('season_id', $season->id)->pluck('value', 'key')->all();
        $settings = array_merge($globalSettings, $seasonSettings);

        return Inertia::render('Settings/Seasons/Show', [
            'season' => $season,
            'allTerms' => $allTerms,
            'settings' => $settings,
            'blocks' => $season->blocks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'       => 'required|string|max:50|unique:seasons,code',
            'name_ar'    => 'required|string|max:255',
            'name_en'    => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'is_active'  => 'boolean',
        ]);

        $season = Season::create($validated);

        // Seed contract settings for the new season
        $globalSettings = \App\Models\ContractSetting::whereNull('season_id')->get();
        foreach ($globalSettings as $setting) {
            \App\Models\ContractSetting::create([
                'season_id' => $season->id,
                'key'       => $setting->key,
                'value'     => $setting->value,
            ]);
        }

        // Seed terms for the new season
        $globalTerms = Term::whereNull('season_id')
            ->whereNull('contract_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        foreach ($globalTerms as $term) {
            Term::create([
                'season_id'     => $season->id,
                'parent_id'     => $term->id,
                'text_ar'       => $term->text_ar,
                'text_en'       => $term->text_en,
                'is_active'     => $term->is_active,
                'has_variables' => $term->has_variables,
                'sort_order'    => $term->sort_order,
            ]);
        }

        // Seed blocks for the new season
        $globalBlocks = \App\Models\ContractBlock::whereNull('season_id')->whereNull('contract_id')->get();
        foreach ($globalBlocks as $block) {
            \App\Models\ContractBlock::create([
                'season_id'  => $season->id,
                'key'        => $block->key,
                'is_enabled' => $block->is_enabled,
                'content'    => $block->content,
                'sort_order' => $block->sort_order,
            ]);
        }

        if (!session()->has('active_season_id')) {
            return redirect()->route('season.select')->with('success', 'تم إنشاء الموسم بنجاح. يرجى اختيار الموسم النشط.');
        }

        return redirect()->back()->with('success', 'تم إنشاء الموسم بنجاح.');
    }

    public function update(Request $request, Season $season)
    {
        $validated = $request->validate([
            'code'             => 'required|string|max:50|unique:seasons,code,' . $season->id,
            'name_ar'          => 'required|string|max:255',
            'name_en'          => 'nullable|string|max:255',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'is_active'        => 'boolean',
            'mandatory_period' => 'integer|min:0',
            'renewal_period'   => 'integer|min:0',
        ]);

        $season->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الموسم بنجاح.');
    }

    public function updateBlock(Request $request, Season $season, $blockId)
    {
        $block = $season->blocks()->findOrFail($blockId);

        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'content'    => 'nullable|array',
        ]);

        $block->update($validated);

        return redirect()->back()->with('success', 'تم تحديث جزء العقد بنجاح.');
    }

    public function destroy(Request $request, Season $season)
    {
        $this->validateSecureDelete($request);
        $season->delete();
        return redirect()->back()->with('success', 'تم حذف الموسم بنجاح.');
    }
}
