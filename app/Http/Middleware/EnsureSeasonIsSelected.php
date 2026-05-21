<?php

namespace App\Http\Middleware;

use App\Models\Season;
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
            if (Season::where('is_active', true)->doesntExist()) {
                if (!$request->routeIs('settings.seasons.*')) {
                    return redirect()->route('settings.seasons.index', ['create' => 1]);
                }

                return $next($request);
            }

            // Prevent redirect loop if already on select-season route
            if (!$request->routeIs('season.select') && !$request->routeIs('season.store')) {
                return redirect()->route('season.select');
            }
        }

        return $next($request);
    }
}