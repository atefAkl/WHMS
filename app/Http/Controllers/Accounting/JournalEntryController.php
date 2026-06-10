<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class JournalEntryController extends Controller
{
    public function index(Request $request)
    {
        $query = JournalEntry::with('creator')->withCount('lines');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('date', '<=', $request->to_date);
        }

        $entries = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20)
            ->withQueryString();

        foreach ($entries as $entry) {
            $entry->total_debit = $entry->lines()->sum('debit');
            $entry->total_credit = $entry->lines()->sum('credit');
        }

        return Inertia::render('Accounting/JournalEntries/Index', [
            'entries' => $entries,
            'filters' => $request->only(['search', 'status', 'from_date', 'to_date'])
        ]);
    }

    public function create()
    {
        $accounts = Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();
        
        return Inertia::render('Accounting/JournalEntries/CreateEdit', [
            'accounts' => $accounts,
            'entry' => null,
            'lines' => [
                ['id' => 'new-1', 'account_id' => '', 'description' => '', 'debit' => '', 'credit' => ''],
                ['id' => 'new-2', 'account_id' => '', 'description' => '', 'debit' => '', 'credit' => '']
            ]
        ]);
    }

    public function store(Request $request)
    {
        return $this->saveEntry($request, new JournalEntry());
    }

    public function update(Request $request, JournalEntry $journal_entry)
    {
        if ($journal_entry->status === 'posted') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'لا يمكن تعديل قيد مرحل'], 403);
            }
            return redirect()->route('accounting.journal-entries.index')->with('error', 'لا يمكن تعديل قيد مرحل');
        }

        return $this->saveEntry($request, $journal_entry);
    }

    private function saveEntry(Request $request, JournalEntry $entry)
    {
        $isDraft = $request->input('action') === 'draft';
        $isAutoSave = $request->boolean('is_auto_save');

        $rules = [
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'lines' => 'required|array|min:2',
        ];

        // Relaxed validation for drafts
        if (!$isDraft) {
            $rules['lines.*.account_id'] = 'required|exists:accounts,id';
            $rules['lines.*.debit'] = 'nullable|numeric|min:0';
            $rules['lines.*.credit'] = 'nullable|numeric|min:0';
        } else {
            $rules['lines.*.account_id'] = 'nullable';
        }

        $validated = $request->validate($rules);

        $totalDebit = 0;
        $totalCredit = 0;
        $validLines = [];

        foreach ($validated['lines'] as $line) {
            if (empty($line['account_id']) && $isDraft) continue;

            $totalDebit += (float) ($line['debit'] ?? 0);
            $totalCredit += (float) ($line['credit'] ?? 0);
            
            if (!$isDraft && empty($line['debit']) && empty($line['credit'])) {
                if ($request->wantsJson()) return response()->json(['errors' => ['lines' => 'كل سطر يجب أن يحتوي إما على مبلغ مدين أو مبلغ دائن']], 422);
                return redirect()->back()->withErrors(['lines' => 'كل سطر يجب أن يحتوي إما على مبلغ مدين أو مبلغ دائن'])->withInput();
            }

            $validLines[] = $line;
        }

        if (!$isDraft) {
            if (round($totalDebit, 2) !== round($totalCredit, 2)) {
                if ($request->wantsJson()) return response()->json(['errors' => ['lines' => 'إجمالي المبالغ المدينة لا يساوي إجمالي المبالغ الدائنة']], 422);
                return redirect()->back()->withErrors(['lines' => 'إجمالي المبالغ المدينة لا يساوي إجمالي المبالغ الدائنة'])->withInput();
            }

            if ($totalDebit == 0) {
                if ($request->wantsJson()) return response()->json(['errors' => ['lines' => 'يجب إدخال مبالغ أكبر من الصفر']], 422);
                return redirect()->back()->withErrors(['lines' => 'يجب إدخال مبالغ أكبر من الصفر'])->withInput();
            }
        }

        DB::beginTransaction();
        try {
            if (!$entry->exists) {
                $year = Carbon::parse($validated['date'])->format('y');
                $month = Carbon::parse($validated['date'])->format('m');
                $lastEntry = JournalEntry::withTrashed()->whereMonth('date', $month)->whereYear('date', Carbon::parse($validated['date'])->format('Y'))->orderBy('id', 'desc')->first();
                $serial = $lastEntry ? intval(substr($lastEntry->reference_number, -4)) + 1 : 1;
                $refNumber = "JV-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT);
                $entry->reference_number = $refNumber;
                $entry->created_by = auth()->id();
            }

            // Always update time if saving, user wanted datetime. Using Carbon to parse full datetime
            $entry->date = Carbon::parse($validated['date'])->format('Y-m-d H:i:s');
            $entry->description = $validated['description'];
            $entry->status = $isDraft ? 'draft' : 'posted';
            $entry->save();

            // Sync Lines
            $entry->lines()->delete();
            foreach ($validLines as $line) {
                if (!empty($line['account_id'])) {
                    JournalLine::create([
                        'journal_entry_id' => $entry->id,
                        'account_id' => $line['account_id'],
                        'description' => $line['description'] ?? null,
                        'debit' => $line['debit'] ?? 0,
                        'credit' => $line['credit'] ?? 0,
                    ]);
                }
            }

            DB::commit();

            if ($request->wantsJson() || $isAutoSave) {
                return response()->json([
                    'message' => 'تم الحفظ بنجاح',
                    'entry' => $entry->load('lines')
                ]);
            }

            $msg = $isDraft ? 'تم حفظ المسودة بنجاح' : 'تم حفظ القيد وتوجيهه بنجاح';
            return redirect()->route('accounting.journal-entries.index')->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->wantsJson() || $isAutoSave) {
                return response()->json(['message' => 'حدث خطأ أثناء الحفظ'], 500);
            }
            return redirect()->back()->with('error', 'حدث خطأ أثناء الحفظ: ' . $e->getMessage())->withInput();
        }
    }

    public function show(JournalEntry $journal_entry)
    {
        $journal_entry->load(['lines.account', 'creator']);
        $journal_entry->total_debit = $journal_entry->lines->sum('debit');
        $journal_entry->total_credit = $journal_entry->lines->sum('credit');

        return Inertia::render('Accounting/JournalEntries/Show', [
            'entry' => $journal_entry
        ]);
    }

    public function edit(JournalEntry $journal_entry)
    {
        if ($journal_entry->status === 'posted') {
            return redirect()->route('accounting.journal-entries.index')->with('error', 'لا يمكن تعديل قيد مرحل');
        }
        
        $accounts = Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();
        $journal_entry->load('lines');
        
        return Inertia::render('Accounting/JournalEntries/CreateEdit', [
            'accounts' => $accounts,
            'entry' => $journal_entry,
            'lines' => $journal_entry->lines
        ]);
    }

    public function destroy(JournalEntry $journal_entry)
    {
        if ($journal_entry->status === 'posted') {
            return redirect()->back()->with('error', 'لا يمكن حذف قيد مرحل');
        }

        $journal_entry->delete();
        return redirect()->route('accounting.journal-entries.index')->with('success', 'تم حذف القيد بنجاح');
    }

    public function postEntry(JournalEntry $journal_entry)
    {
        if ($journal_entry->status === 'posted') {
            return redirect()->back()->with('error', 'القيد مرحل بالفعل');
        }

        $totalDebit = $journal_entry->lines()->sum('debit');
        $totalCredit = $journal_entry->lines()->sum('credit');

        if (round($totalDebit, 2) !== round($totalCredit, 2) || $totalDebit == 0) {
            return redirect()->back()->with('error', 'لا يمكن ترحيل القيد لأنه غير متزن أو فارغ');
        }

        $journal_entry->update(['status' => 'posted']);
        return redirect()->back()->with('success', 'تم ترحيل القيد بنجاح');
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:journal_entries,id',
            'action' => 'required|in:post,delete'
        ]);

        $entries = JournalEntry::whereIn('id', $validated['ids'])->get();

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($entries as $entry) {
                if ($entry->status === 'posted') continue;

                if ($validated['action'] === 'delete') {
                    $entry->delete();
                    $count++;
                } else if ($validated['action'] === 'post') {
                    $totalDebit = $entry->lines()->sum('debit');
                    $totalCredit = $entry->lines()->sum('credit');
                    if (round($totalDebit, 2) === round($totalCredit, 2) && $totalDebit > 0) {
                        $entry->update(['status' => 'posted']);
                        $count++;
                    }
                }
            }
            DB::commit();
            
            $msg = $validated['action'] === 'post' ? "تم ترحيل $count قيد بنجاح" : "تم حذف $count قيد بنجاح";
            return redirect()->back()->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء تنفيذ الإجراء المجمع');
        }
    }
}
