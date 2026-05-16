<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Season Selection
    Route::get('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'create'])->name('season.select');
    Route::post('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'store'])->name('season.store');

    // Routes that require an active season
    Route::middleware('season')->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Dashboard');
        })->name('dashboard');

        Route::get('/pallets', [\App\Http\Controllers\PalletController::class, 'index'])->name('pallets.index');
        Route::resource('customers', \App\Http\Controllers\CustomerController::class)->except(['create', 'edit']);
        Route::post('customers/{customer}/contacts', [\App\Http\Controllers\ContactController::class, 'store'])->name('customers.contacts.store');
        Route::put('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'update'])->name('customers.contacts.update');
        Route::delete('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'destroy'])->name('customers.contacts.destroy');

        // Contracts
        Route::get('contracts/create', [\App\Http\Controllers\ContractController::class, 'create'])->name('contracts.create');
        Route::post('contracts', [\App\Http\Controllers\ContractController::class, 'store'])->name('contracts.store');
        Route::get('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'show'])->name('contracts.show');

        // Agents
        Route::get('agents', [\App\Http\Controllers\AgentController::class, 'index'])->name('agents.index');
        Route::post('agents', [\App\Http\Controllers\AgentController::class, 'store'])->name('agents.store');



        // Season-term assignment
        Route::get('seasons/{season}/terms', [\App\Http\Controllers\TermController::class, 'seasonTerms'])->name('seasons.terms.index');
        Route::post('seasons/{season}/terms/sync', [\App\Http\Controllers\TermController::class, 'syncSeasonTerms'])->name('seasons.terms.sync');
        Route::post('seasons/{season}/terms/reorder', [\App\Http\Controllers\TermController::class, 'reorderSeasonTerms'])->name('seasons.terms.reorder');

        // Settings Sub-module
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('/', [\App\Http\Controllers\SettingsController::class, 'index'])->name('index');
            
            Route::post('countries/seed', [\App\Http\Controllers\Settings\CountryController::class, 'seed'])->name('countries.seed');
            Route::resource('countries', \App\Http\Controllers\Settings\CountryController::class)->except(['show', 'create', 'edit']);
            Route::resource('categories', \App\Http\Controllers\Settings\CustomerCategoryController::class)->except(['show', 'create', 'edit']);
            Route::resource('storage-items', \App\Http\Controllers\Settings\StorageItemController::class)->parameters(['storage-items' => 'storage_item'])->except(['show', 'create', 'edit']);
            Route::post('terms/settings', [\App\Http\Controllers\Settings\TermController::class, 'updateSettings'])->name('terms.settings.update');
            Route::resource('terms', \App\Http\Controllers\Settings\TermController::class)->except(['show', 'create', 'edit']);
            Route::resource('seasons', \App\Http\Controllers\Settings\SeasonController::class)->except(['create', 'edit']);
        });
    });
});

require __DIR__.'/auth.php';
