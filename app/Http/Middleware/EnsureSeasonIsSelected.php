<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSeasonIsSelected
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('active_season_id')) {
            // Prevent redirect loop if already on select-season route
            if (!$request->routeIs('season.select') && !$request->routeIs('season.store')) {
                return redirect()->route('season.select');
            }
        }

        return $next($request);
    }
}
