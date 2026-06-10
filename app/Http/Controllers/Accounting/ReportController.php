<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function accountStatement(Request $request)
    {
        $accounts = Account::where('is_transactional', true)->orderBy('code')->get();
        $accountId = $request->input('account_id');
        $startDate = $request->input('start_date', date('Y-01-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));

        $lines = [];
        $openingBalance = 0;
        $totalDebit = 0;
        $totalCredit = 0;
        $closingBalance = 0;
        $account = null;

        if ($accountId) {
            $account = Account::findOrFail($accountId);
            
            // Calculate opening balance
            $openingLines = JournalLine::where('account_id', $accountId)
                ->whereHas('entry', function ($q) use ($startDate) {
                    $q->where('date', '<', $startDate)->where('status', 'posted');
                })->get();

            $openingDebit = $openingLines->sum('debit');
            $openingCredit = $openingLines->sum('credit');
            $openingBalance = $account->normal_balance === 'debit' 
                ? $openingDebit - $openingCredit 
                : $openingCredit - $openingDebit;

            // Get transactions in the period
            $linesQuery = JournalLine::with('entry')
                ->where('account_id', $accountId)
                ->whereHas('entry', function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date', [$startDate, $endDate])->where('status', 'posted');
                })
                ->orderBy(function ($query) {
                    $query->select('date')
                        ->from('journal_entries')
                        ->whereColumn('journal_entries.id', 'journal_lines.journal_entry_id');
                })->get();

            $runningBalance = $openingBalance;
            
            foreach ($linesQuery as $line) {
                if ($account->normal_balance === 'debit') {
                    $runningBalance += $line->debit - $line->credit;
                } else {
                    $runningBalance += $line->credit - $line->debit;
                }
                
                $line->balance = $runningBalance;
                $lines[] = $line;
            }

            $totalDebit = $linesQuery->sum('debit');
            $totalCredit = $linesQuery->sum('credit');
            $closingBalance = $runningBalance;
        }

        return Inertia::render('Accounting/Reports/AccountStatement', [
            'accounts' => $accounts,
            'filters' => [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'reportData' => [
                'account' => $account,
                'openingBalance' => $openingBalance,
                'lines' => $lines,
                'totalDebit' => $totalDebit,
                'totalCredit' => $totalCredit,
                'closingBalance' => $closingBalance
            ]
        ]);
    }

    public function trialBalance(Request $request)
    {
        $startDate = $request->input('start_date', date('Y-01-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));

        // We need all accounts with their sum of debits and credits
        $accounts = Account::orderBy('code')->get();
        
        $accountBalances = [];
        $totalDebit = 0;
        $totalCredit = 0;

        // Group by account id
        $lines = JournalLine::whereHas('entry', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('date', [$startDate, $endDate])->where('status', 'posted');
        })
        ->select('account_id', DB::raw('SUM(debit) as total_debit'), DB::raw('SUM(credit) as total_credit'))
        ->groupBy('account_id')
        ->get()
        ->keyBy('account_id');

        // Roll up balances to parent accounts
        foreach ($accounts as $account) {
            $accountData = [
                'id' => $account->id,
                'parent_id' => $account->parent_id,
                'code' => $account->code,
                'name_ar' => $account->name_ar,
                'name_en' => $account->name_en,
                'type' => $account->type,
                'normal_balance' => $account->normal_balance,
                'is_transactional' => $account->is_transactional,
                'debit' => 0,
                'credit' => 0,
                'balance' => 0
            ];

            if ($account->is_transactional && isset($lines[$account->id])) {
                $accountData['debit'] = (float) $lines[$account->id]->total_debit;
                $accountData['credit'] = (float) $lines[$account->id]->total_credit;
                
                if ($account->normal_balance === 'debit') {
                    $accountData['balance'] = $accountData['debit'] - $accountData['credit'];
                } else {
                    $accountData['balance'] = $accountData['credit'] - $accountData['debit'];
                }
            }

            $accountBalances[$account->id] = $accountData;
        }

        // Aggregate to parents (simple implementation - would be better recursively if deep nesting)
        // Reverse array to start from leaves
        $reversedAccounts = array_reverse($accountBalances, true);
        foreach ($reversedAccounts as $id => $data) {
            if ($data['parent_id'] && isset($accountBalances[$data['parent_id']])) {
                $accountBalances[$data['parent_id']]['debit'] += $data['debit'];
                $accountBalances[$data['parent_id']]['credit'] += $data['credit'];
                
                $parentNorm = $accountBalances[$data['parent_id']]['normal_balance'];
                if ($parentNorm === 'debit') {
                    $accountBalances[$data['parent_id']]['balance'] = $accountBalances[$data['parent_id']]['debit'] - $accountBalances[$data['parent_id']]['credit'];
                } else {
                    $accountBalances[$data['parent_id']]['balance'] = $accountBalances[$data['parent_id']]['credit'] - $accountBalances[$data['parent_id']]['debit'];
                }
            }
        }

        // Calculate totals for transactional accounts
        foreach ($accountBalances as $data) {
            if ($data['is_transactional']) {
                $totalDebit += $data['debit'];
                $totalCredit += $data['credit'];
            }
        }

        // Return hierarchical tree structure or just flat list indented
        $treeList = [];
        foreach ($accounts as $account) {
            if ($accountBalances[$account->id]['debit'] > 0 || $accountBalances[$account->id]['credit'] > 0 || !$account->is_transactional) {
                // Determine level based on code length or a recursive function. We assume code length implies level for simplicity here.
                $level = strlen($account->code) <= 1 ? 0 : (strlen($account->code) <= 2 ? 1 : 2);
                $accountBalances[$account->id]['level'] = $level;
                $treeList[] = $accountBalances[$account->id];
            }
        }

        return Inertia::render('Accounting/Reports/TrialBalance', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'reportData' => [
                'lines' => $treeList,
                'totalDebit' => $totalDebit,
                'totalCredit' => $totalCredit,
            ]
        ]);
    }

    public function incomeStatement(Request $request)
    {
        $startDate = $request->input('start_date', date('Y-01-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));

        // Income statement only uses Revenue and Expense accounts
        $accounts = Account::whereIn('type', ['revenue', 'expense'])->orderBy('code')->get();
        
        $revenues = [];
        $expenses = [];
        $totalRevenue = 0;
        $totalExpense = 0;

        $lines = JournalLine::whereHas('entry', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('date', [$startDate, $endDate])->where('status', 'posted');
        })
        ->select('account_id', DB::raw('SUM(debit) as total_debit'), DB::raw('SUM(credit) as total_credit'))
        ->groupBy('account_id')
        ->get()
        ->keyBy('account_id');

        foreach ($accounts as $account) {
            if (!$account->is_transactional) continue;

            $debit = isset($lines[$account->id]) ? (float) $lines[$account->id]->total_debit : 0;
            $credit = isset($lines[$account->id]) ? (float) $lines[$account->id]->total_credit : 0;
            
            $balance = 0;
            if ($account->type === 'revenue') {
                $balance = $credit - $debit; // revenue is normal credit
                if ($balance != 0) {
                    $revenues[] = [
                        'code' => $account->code,
                        'name_ar' => $account->name_ar,
                        'name_en' => $account->name_en,
                        'balance' => $balance
                    ];
                    $totalRevenue += $balance;
                }
            } else if ($account->type === 'expense') {
                $balance = $debit - $credit; // expense is normal debit
                if ($balance != 0) {
                    $expenses[] = [
                        'code' => $account->code,
                        'name_ar' => $account->name_ar,
                        'name_en' => $account->name_en,
                        'balance' => $balance
                    ];
                    $totalExpense += $balance;
                }
            }
        }

        $netIncome = $totalRevenue - $totalExpense;

        return Inertia::render('Accounting/Reports/IncomeStatement', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'reportData' => [
                'revenues' => $revenues,
                'totalRevenue' => $totalRevenue,
                'expenses' => $expenses,
                'totalExpense' => $totalExpense,
                'netIncome' => $netIncome,
            ]
        ]);
    }
}
