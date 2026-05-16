<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Pallet;
use Inertia\Inertia;

class PalletController extends Controller
{
    public function index()
    {
        $pallets = Pallet::with(['customer', 'location', 'contract'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Pallets/Index', [
            'pallets' => $pallets,
        ]);
    }
}
