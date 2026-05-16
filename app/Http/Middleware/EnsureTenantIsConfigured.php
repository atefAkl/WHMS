<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ContractSetting;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsConfigured
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if company_name exists and is not empty
        $companyName = ContractSetting::where('key', 'company_name')->value('value');

        if (empty(trim($companyName))) {
            // Prevent redirect loop if already on tenant-setup route
            if (!$request->routeIs('tenant.setup') && !$request->routeIs('tenant.store')) {
                return redirect()->route('tenant.setup');
            }
        }

        return $next($request);
    }
}
