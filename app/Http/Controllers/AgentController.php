<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class AgentController extends Controller
{
    use ApiResponse;

    public function index() {
        return $this->successResponse(Agent::where('is_active', true)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'phone_number'       => 'required|string|max:20',
            'id_number'          => 'nullable|string|max:20',
            'email'              => 'nullable|email',
            'can_sign'           => 'boolean',
            'can_withdraw_goods' => 'boolean',
        ]);
        $agent = Agent::create($validated);
        return redirect()->back()->with('success', 'تم إضافة المندوب.')->with('new_agent', $agent);
    }
}
