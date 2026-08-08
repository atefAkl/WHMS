<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->latest();

        // Filter by Action Type
        if ($request->filled('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        // Filter by Subject Type
        if ($request->filled('subject_type')) {
            $query->where('subject_type', 'like', "%{$request->subject_type}%");
        }

        // Filter by User ID
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by Date Range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Keyword Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%")
                  ->orWhere('subject_label', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate(20)->withQueryString();

        // Calculate Overview Summary Stats
        $today = Carbon::today();
        $totalToday = ActivityLog::whereDate('created_at', $today)->count();
        $createsCount = ActivityLog::whereDate('created_at', $today)->where('action_type', 'create')->count();
        $updatesCount = ActivityLog::whereDate('created_at', $today)->where('action_type', 'update')->count();
        $deletesCount = ActivityLog::whereDate('created_at', $today)->where('action_type', 'delete')->count();

        // Users dropdown list for filter
        $users = User::select('id', 'name', 'username', 'email')->get();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'stats' => [
                'total_today' => $totalToday,
                'creates_count' => $createsCount,
                'updates_count' => $updatesCount,
                'deletes_count' => $deletesCount,
            ],
            'users' => $users,
            'filters' => $request->only([
                'action_type',
                'subject_type',
                'user_id',
                'from_date',
                'to_date',
                'search',
            ]),
        ]);
    }
}
