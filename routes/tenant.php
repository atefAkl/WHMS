<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'web',
    Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
    Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
])->group(function () {

    // Auth Routes (Login, Password Reset, etc.)
    require __DIR__ . '/auth.php';

    Route::middleware('auth')->group(function () {
        // Session Switcher Routes
        Route::post('/set-active-season', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'season_id' => 'required|exists:seasons,id'
            ]);

            $season = \App\Models\Season::findOrFail($request->season_id);
            session(['active_season_id' => $season->id]);

            return back()->with('success', 'تم تغيير الموسم التنافسي بنجاح إلى: ' . $season->name);
        })->name('set-active-season');

        // Tenant Onboarding / Setup
        Route::get('/tenant-setup', [\App\Http\Controllers\TenantSetupController::class, 'create'])->name('tenant.setup');
        Route::post('/tenant-setup', [\App\Http\Controllers\TenantSetupController::class, 'store'])->name('tenant.store');

        // API for settings
        Route::get('/api/settings', [\App\Http\Controllers\TenantSettingsController::class, 'index']);
        Route::post('/api/settings', [\App\Http\Controllers\TenantSettingsController::class, 'store']);

        // Routes that require a configured tenant
        Route::middleware('tenant')->group(function () {

            // Drivers API
            Route::get('api/drivers', [\App\Http\Controllers\DriverController::class, 'index'])->name('api.drivers.index');
            Route::post('api/drivers', [\App\Http\Controllers\DriverController::class, 'store'])->name('api.drivers.store');

            // Available Inventory API inside tenant middleware
            Route::get('api/contracts/{contract}/available-inventory', function (\App\Models\Contract $contract) {
                try {
                    $entries = \App\Models\InventoryEntry::query()
                        ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class, \App\Models\InventoryAdjustment::class], function ($q) use ($contract) {
                            $q->where('contract_id', $contract->id);
                        })
                        ->whereNotNull('pallet_id')
                        ->with(['inventoryItem', 'variant', 'pallet'])
                        ->get();

                    if ($entries->isEmpty()) {
                        return response()->json([]);
                    }

                    $grouped = $entries->groupBy('pallet_id');
                    $result = [];

                    foreach ($grouped as $palletId => $palletEntries) {
                        $pallet = $palletEntries->first()->pallet;
                        if (!$pallet) continue;

                        $subGroups = $palletEntries->groupBy(function ($e) {
                            return $e->inventory_item_id . '_' . $e->inventory_item_variant_id;
                        });

                        foreach ($subGroups as $group) {
                            $first = $group->first();
                            $qtyIn = (float) $group->sum('quantity_in');
                            $qtyOut = (float) $group->sum('quantity_out');
                            $balance = $qtyIn - $qtyOut;

                            if ($balance <= 0) continue;

                            $result[] = [
                                'inventory_item_id' => $first->inventory_item_id,
                                'inventory_item_variant_id' => $first->inventory_item_variant_id,
                                'pallet_id' => $pallet->id,
                                'available_qty' => round($balance, 2),
                                'inventoryItem' => [
                                    'id' => $first->inventory_item_id,
                                    'name' => $first->inventoryItem ? $first->inventoryItem->name : 'صنف تمور',
                                    'code' => $first->inventoryItem ? $first->inventoryItem->code : 'DAT'
                                ],
                                'variant' => [
                                    'id' => $first->inventory_item_variant_id,
                                    'name' => $first->variant ? $first->variant->name : 'كرتون / درجة',
                                    'code' => $first->variant ? $first->variant->code : 'VAR'
                                ],
                                'pallet' => [
                                    'id' => $pallet->id,
                                    'code' => $pallet->code,
                                    'pallet_number' => $pallet->pallet_number ?: (string)$pallet->id
                                ]
                            ];
                        }
                    }

                    return response()->json($result);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error("Available Inventory API Error: " . $e->getMessage());
                    return response()->json([], 200);
                }
            })->name('api.contracts.available-inventory');

            // Notifications Routes
            Route::get('/notifications', function () {
                return Inertia::render('Tenant/Notifications/Index', [
                    'notifications' => auth()->user() ? auth()->user()->notifications()->paginate(20) : []
                ]);
            })->name('notifications.index');
            Route::post('/notifications/{id}/mark-read', function ($id) {
                if (auth()->user()) {
                    auth()->user()->notifications()->where('id', $id)->first()?->markAsRead();
                }
                return response()->json(['success' => true]);
            })->name('notifications.markOneRead');
            Route::get('/api/notifications/unread-count', function () {
                if (!auth()->user()) return response()->json(['unread_count' => 0, 'recent' => []]);
                return response()->json([
                    'unread_count' => auth()->user()->unreadNotifications()->count(),
                    'recent' => auth()->user()->notifications()->take(5)->get()
                ]);
            })->name('api.notifications.unread-count');

            // Season Selection
            Route::get('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'create'])->name('season.select');
            Route::post('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'store'])->name('season.store');

            // Routes that require an active season
            Route::middleware('season')->group(function () {
                Route::get('/dashboard', function () {
                    return Inertia::render('Dashboard');
                })->name('dashboard');

                // Inventory Adjustments Vouchers (11 Code)
                Route::resource('inventory-adjustments', \App\Http\Controllers\Warehouse\InventoryAdjustmentController::class);
                Route::post('inventory-adjustments/{inventoryAdjustment}/approve', [\App\Http\Controllers\Warehouse\InventoryAdjustmentController::class, 'approve'])->name('inventory-adjustments.approve');
                Route::post('inventory-adjustments/{inventoryAdjustment}/reopen', [\App\Http\Controllers\Warehouse\InventoryAdjustmentController::class, 'reopen'])->name('inventory-adjustments.reopen');

                // Pallet Rearrangements Vouchers (15 Code)
                Route::resource('pallet-rearrangements', \App\Http\Controllers\Warehouse\PalletRearrangementController::class);
                Route::post('pallet-rearrangements/{palletRearrangement}/approve', [\App\Http\Controllers\Warehouse\PalletRearrangementController::class, 'approve'])->name('pallet-rearrangements.approve');
                Route::post('pallet-rearrangements/{palletRearrangement}/reopen', [\App\Http\Controllers\Warehouse\PalletRearrangementController::class, 'reopen'])->name('pallet-rearrangements.reopen');
                Route::get('api/contracts/{contract}/rearrangement-options', [\App\Http\Controllers\Warehouse\PalletRearrangementController::class, 'getContractRearrangementOptions'])->name('api.contracts.rearrangement-options');

                Route::resource('pallets', \App\Http\Controllers\PalletController::class)->except(['create', 'edit']);
                Route::resource('customers', \App\Http\Controllers\CustomerController::class)->except(['create', 'edit']);
                Route::resource('inventory-items', \App\Http\Controllers\InventoryItemController::class)->parameters(['inventory-items' => 'inventory_item'])->except(['create', 'edit']);
                Route::put('inventory-item-variants/{variant}', [\App\Http\Controllers\InventoryItemController::class, 'updateVariant'])->name('inventory-item-variants.update');
                Route::get('api/pallets/lookup', [\App\Http\Controllers\PalletController::class, 'lookup'])->name('api.pallets.lookup');
                Route::get('api/contracts/{contract}/occupancy-stats', [\App\Http\Controllers\ReceptionController::class, 'getOccupancyStats'])->name('api.contracts.occupancy-stats');
                Route::post('customers/{customer}/contacts', [\App\Http\Controllers\ContactController::class, 'store'])->name('customers.contacts.store');
                Route::put('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'update'])->name('customers.contacts.update');
                Route::delete('customers/{customer}/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'destroy'])->name('customers.contacts.destroy');

                // Contracts
                Route::get('contracts', [\App\Http\Controllers\ContractController::class, 'index'])->name('contracts.index');
                Route::get('contracts/create', [\App\Http\Controllers\ContractController::class, 'create'])->name('contracts.create');
                Route::post('contracts', [\App\Http\Controllers\ContractController::class, 'store'])->name('contracts.store');
                Route::get('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'show'])->name('contracts.show');
                Route::put('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'update'])->name('contracts.update');
                Route::post('contracts/{contract}/activate', [\App\Http\Controllers\ContractController::class, 'activate'])->name('contracts.activate');
                Route::post('contracts/{contract}/suspend', [\App\Http\Controllers\ContractController::class, 'suspend'])->name('contracts.suspend');
                Route::post('contracts/{contract}/end', [\App\Http\Controllers\ContractController::class, 'endContract'])->name('contracts.end');
                Route::post('contracts/{contract}/cancel', [\App\Http\Controllers\ContractController::class, 'cancelContract'])->name('contracts.cancel');
                Route::delete('contracts/{contract}', [\App\Http\Controllers\ContractController::class, 'destroy'])->name('contracts.destroy');

                Route::post('contracts/{contract}/periods', [\App\Http\Controllers\ContractController::class, 'addPeriod'])->name('contracts.periods.store');
                Route::patch('contracts/{contract}/periods/{period}', [\App\Http\Controllers\ContractController::class, 'updatePeriod'])->name('contracts.periods.update');
                Route::patch('contracts/{contract}/periods/{period}/items', [\App\Http\Controllers\ContractController::class, 'updatePeriodItems'])->name('contracts.periods.items.update');
                Route::patch('contracts/{contract}/periods/{period}/status', [\App\Http\Controllers\ContractController::class, 'updatePeriodStatus'])->name('contracts.periods.status');
                Route::delete('contracts/{contract}/periods/{period}', [\App\Http\Controllers\ContractController::class, 'destroyPeriod'])->name('contracts.periods.destroy');
                Route::post('contracts/{contract}/contacts', [\App\Http\Controllers\ContractController::class, 'addContact'])->name('contracts.contacts.store');
                Route::patch('contracts/{contract}/contacts/{contractContact}/status', [\App\Http\Controllers\ContractController::class, 'updateContactStatus'])->name('contracts.contacts.status');

                Route::post('contracts/{contract}/invoices-period', [\App\Http\Controllers\ContractController::class, 'storeInvoiceFromPeriod'])->name('contracts.invoices.store-from-period');
                Route::post('contracts/{contract}/payments', [\App\Http\Controllers\ContractController::class, 'storePayment'])->name('contracts.payments.store');
                Route::get('contracts/{contract}/vouchers', [\App\Http\Controllers\ContractController::class, 'getVouchers'])->name('contracts.vouchers');
                Route::post('contracts/{contract}/vouchers/bulk-approve', [\App\Http\Controllers\ContractController::class, 'bulkApproveVouchers'])->name('contracts.vouchers.bulk-approve');
                Route::post('contracts/{contract}/vouchers/bulk-reopen', [\App\Http\Controllers\ContractController::class, 'bulkReopenVouchers'])->name('contracts.vouchers.bulk-reopen');
                Route::get('contracts/{contract}/vouchers/bulk-print', [\App\Http\Controllers\ContractController::class, 'bulkPrintVouchers'])->name('contracts.vouchers.bulk-print');
                Route::get('contracts/{contract}/pallets', [\App\Http\Controllers\ContractController::class, 'getPallets'])->name('contracts.pallets');
                Route::get('api/contracts/{contract}/pallets', [\App\Http\Controllers\ContractController::class, 'getPallets'])->name('api.contracts.pallets');

                Route::get('api/contracts/{contract}/pallets/{pallet}/items', function (\App\Models\Contract $contract, \App\Models\Pallet $pallet) {
                    $entries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)
                        ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class, \App\Models\InventoryAdjustment::class, \App\Models\PalletRearrangement::class], function ($query) use ($contract) {
                            $query->where('contract_id', $contract->id);
                        })
                        ->with('inventoryItem')
                        ->get();

                    $items = $entries->groupBy('inventory_item_id')->map(function ($group) {
                        $first = $group->first();
                        $qtyIn = $group->sum('quantity_in');
                        $qtyOut = $group->sum('quantity_out');
                        return [
                            'id' => $first->inventory_item_id,
                            'name' => $first->inventoryItem?->name ?? 'غير محدد',
                            'balance' => $qtyIn - $qtyOut,
                        ];
                    })->values()->filter(fn($i) => $i['balance'] > 0);

                    return response()->json($items);
                })->name('api.contracts.pallets.items');

                Route::get('api/contracts/{contract}/pallets/{pallet}/items/{item}/variants', function (\App\Models\Contract $contract, \App\Models\Pallet $pallet, \App\Models\InventoryItem $item) {
                    $entries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)
                        ->where('inventory_item_id', $item->id)
                        ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class, \App\Models\InventoryAdjustment::class, \App\Models\PalletRearrangement::class], function ($query) use ($contract) {
                            $query->where('contract_id', $contract->id);
                        })
                        ->with('variant')
                        ->get();

                    $variants = $entries->groupBy('inventory_item_variant_id')->map(function ($group) {
                        $first = $group->first();
                        $qtyIn = $group->sum('quantity_in');
                        $qtyOut = $group->sum('quantity_out');
                        $name = $first->variant?->name ?? 'افتراضي';
                        $quality = $first->variant?->quality;
                        return [
                            'id' => $first->inventory_item_variant_id,
                            'inventory_item_variant_id' => $first->inventory_item_variant_id,
                            'name' => $name,
                            'quality' => $quality,
                            'variant' => [
                                'name' => $name,
                                'quality' => $quality,
                            ],
                            'balance' => $qtyIn - $qtyOut,
                        ];
                    })->values()->filter(fn($v) => $v['balance'] > 0);

                    return response()->json($variants);
                })->name('api.contracts.pallets.items.variants');

                Route::get('contracts/{contract}/stored-items', [\App\Http\Controllers\ContractController::class, 'getStoredItems'])->name('contracts.stored-items');
                Route::get('contracts/{contract}/item-movements', [\App\Http\Controllers\ContractController::class, 'getItemMovements'])->name('contracts.item-movements');
                Route::get('contracts/{contract}/pallet-movements', [\App\Http\Controllers\ContractController::class, 'getPalletMovements'])->name('contracts.pallet-movements');

                // Agents
                Route::get('agents', [\App\Http\Controllers\AgentController::class, 'index'])->name('agents.index');
                Route::post('agents', [\App\Http\Controllers\AgentController::class, 'store'])->name('agents.store');

                // Customer Categories
                Route::get('customer-categories', [\App\Http\Controllers\CustomerController::class, 'categoriesIndex'])->name('customer-categories.index');
                Route::post('customer-categories', [\App\Http\Controllers\CustomerController::class, 'categoriesStore'])->name('customer-categories.store');
                Route::put('customer-categories/{category}', [\App\Http\Controllers\CustomerController::class, 'categoriesUpdate'])->name('customer-categories.update');
                Route::delete('customer-categories/{category}', [\App\Http\Controllers\CustomerController::class, 'categoriesDestroy'])->name('customer-categories.destroy');

                // Storage Items & Categories
                Route::get('storage-items', [\App\Http\Controllers\StorageItemController::class, 'index'])->name('storage-items.index');
                Route::post('storage-items', [\App\Http\Controllers\StorageItemController::class, 'store'])->name('storage-items.store');
                Route::put('storage-items/{storageItem}', [\App\Http\Controllers\StorageItemController::class, 'update'])->name('storage-items.update');
                Route::delete('storage-items/{storageItem}', [\App\Http\Controllers\StorageItemController::class, 'destroy'])->name('storage-items.destroy');
                Route::get('storage-categories', [\App\Http\Controllers\StorageItemController::class, 'categoriesIndex'])->name('storage-categories.index');
                Route::post('storage-categories', [\App\Http\Controllers\StorageItemController::class, 'categoriesStore'])->name('storage-categories.store');
                Route::put('storage-categories/{category}', [\App\Http\Controllers\StorageItemController::class, 'categoriesUpdate'])->name('storage-categories.update');
                Route::delete('storage-categories/{category}', [\App\Http\Controllers\StorageItemController::class, 'categoriesDestroy'])->name('storage-categories.destroy');

                // Inventory Item Categories
                Route::get('inventory-categories', [\App\Http\Controllers\InventoryItemController::class, 'categoriesIndex'])->name('inventory-categories.index');
                Route::post('inventory-categories', [\App\Http\Controllers\InventoryItemController::class, 'categoriesStore'])->name('inventory-categories.store');
                Route::put('inventory-categories/{category}', [\App\Http\Controllers\InventoryItemController::class, 'categoriesUpdate'])->name('inventory-categories.update');
                Route::delete('inventory-categories/{category}', [\App\Http\Controllers\InventoryItemController::class, 'categoriesDestroy'])->name('inventory-categories.destroy');

                // Receptions (09 Code)
                Route::get('receptions/bulk-print', [\App\Http\Controllers\ReceptionController::class, 'bulkPrint'])->name('receptions.bulk-print');
                Route::resource('receptions', \App\Http\Controllers\ReceptionController::class);
                Route::get('receptions/{reception}/print', [\App\Http\Controllers\ReceptionController::class, 'print'])->name('receptions.print');
                Route::post('receptions/{reception}/approve', [\App\Http\Controllers\ReceptionController::class, 'approve'])->name('receptions.approve');
                Route::post('receptions/{reception}/reopen', [\App\Http\Controllers\ReceptionController::class, 'reopen'])->name('receptions.reopen');

                // Deliveries (12 Code)
                Route::get('deliveries/bulk-print', [\App\Http\Controllers\DeliveryController::class, 'bulkPrint'])->name('deliveries.bulk-print');
                Route::resource('deliveries', \App\Http\Controllers\DeliveryController::class);
                Route::get('deliveries/{delivery}/print', [\App\Http\Controllers\DeliveryController::class, 'print'])->name('deliveries.print');
                Route::post('deliveries/{delivery}/approve', [\App\Http\Controllers\DeliveryController::class, 'approve'])->name('deliveries.approve');
                Route::post('deliveries/{delivery}/reopen', [\App\Http\Controllers\DeliveryController::class, 'reopen'])->name('deliveries.reopen');

                // Exit Authorizations
                Route::resource('exit-authorizations', \App\Http\Controllers\ExitAuthorizationController::class);

                // Accounting Routes
                Route::get('/accounting/accounts', [\App\Http\Controllers\Accounting\AccountController::class, 'index'])->name('accounting.accounts.index');
                Route::post('/accounting/accounts', [\App\Http\Controllers\Accounting\AccountController::class, 'store'])->name('accounting.accounts.store');
                Route::put('/accounting/accounts/{account}', [\App\Http\Controllers\Accounting\AccountController::class, 'update'])->name('accounting.accounts.update');
                Route::delete('/accounting/accounts/{account}', [\App\Http\Controllers\Accounting\AccountController::class, 'destroy'])->name('accounting.accounts.destroy');

                Route::get('/accounting/journal-entries', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'index'])->name('accounting.journal-entries.index');
                Route::get('/accounting/journal-entries/create', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'create'])->name('accounting.journal-entries.create');
                Route::post('/accounting/journal-entries', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'store'])->name('accounting.journal-entries.store');
                Route::get('/accounting/journal-entries/{journalEntry}', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'show'])->name('accounting.journal-entries.show');
                Route::post('/accounting/journal-entries/{journalEntry}/post', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'post'])->name('accounting.journal-entries.post');

                Route::get('/accounting/financial-vouchers', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'index'])->name('accounting.financial-vouchers.index');
                Route::get('/accounting/financial-vouchers/create', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'create'])->name('accounting.financial-vouchers.create');
                Route::post('/accounting/financial-vouchers', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'store'])->name('accounting.financial-vouchers.store');
                Route::get('/accounting/financial-vouchers/{financialVoucher}', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'show'])->name('accounting.financial-vouchers.show');
                Route::post('/accounting/financial-vouchers/{financialVoucher}/approve', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'approve'])->name('accounting.financial-vouchers.approve');

                Route::get('/accounting/statements/trial-balance', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'trialBalance'])->name('accounting.statements.trial-balance');
                Route::get('/accounting/statements/income-statement', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'incomeStatement'])->name('accounting.statements.income-statement');
                Route::get('/accounting/statements/balance-sheet', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'balanceSheet'])->name('accounting.statements.balance-sheet');
                Route::get('/accounting/statements/account-statement', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'accountStatement'])->name('accounting.statements.account-statement');

                // Accounting Route Aliases for Sidebar
                Route::get('/accounting', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'index'])->name('accounting.index');
                Route::get('/accounting/reports/account-statement', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'accountStatement'])->name('accounting.reports.account-statement');
                Route::get('/accounting/reports/trial-balance', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'trialBalance'])->name('accounting.reports.trial-balance');
                Route::get('/accounting/reports/income-statement', [\App\Http\Controllers\Accounting\FinancialStatementController::class, 'incomeStatement'])->name('accounting.reports.income-statement');

                // Services & Queue Tickets Placeholders
                Route::get('/sales/services', function () { return redirect()->route('dashboard'); })->name('sales.services.index');
                Route::get('/queue-tickets', function () { return redirect()->route('dashboard'); })->name('queue-tickets.index');

                // Terms Management
                Route::get('terms', [\App\Http\Controllers\TermController::class, 'index'])->name('terms.index');
                Route::post('terms', [\App\Http\Controllers\TermController::class, 'store'])->name('terms.store');
                Route::put('terms/{term}', [\App\Http\Controllers\TermController::class, 'update'])->name('terms.update');
                Route::delete('terms/{term}', [\App\Http\Controllers\TermController::class, 'destroy'])->name('terms.destroy');
                Route::post('terms/reorder', [\App\Http\Controllers\TermController::class, 'reorder'])->name('terms.reorder');

                // Profile & Settings
                Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
                Route::get('/setting/index', [\App\Http\Controllers\SettingsController::class, 'index']);

                // Tenant Settings Sub-Routes
                Route::prefix('settings')->name('settings.')->group(function () {
                    Route::resource('seasons', \App\Http\Controllers\Settings\SeasonController::class);
                    Route::post('terms/settings', [\App\Http\Controllers\Settings\TermController::class, 'updateSettings'])->name('terms.settings.update');
                    Route::resource('terms', \App\Http\Controllers\Settings\TermController::class)->except(['create', 'edit']);
                    Route::resource('storage-items', \App\Http\Controllers\Settings\StorageItemController::class)->except(['create', 'edit']);
                    Route::resource('inventory-categories', \App\Http\Controllers\Settings\InventoryCategoryController::class)->except(['create', 'edit']);
                    Route::resource('categories', \App\Http\Controllers\Settings\CustomerCategoryController::class)->except(['create', 'edit']);
                    Route::resource('countries', \App\Http\Controllers\Settings\CountryController::class)->except(['create', 'edit']);
                    Route::get('roles-permissions', [\App\Http\Controllers\Tenant\EmployeeController::class, 'rolesPermissions'])->name('roles-permissions');
                    Route::get('general', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'index'])->name('general.index');
                    Route::post('general', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'store'])->name('general.store');
                    Route::get('notifications', [\App\Http\Controllers\Settings\NotificationSettingsController::class, 'index'])->name('notifications.index');
                    Route::post('notifications', [\App\Http\Controllers\Settings\NotificationSettingsController::class, 'store'])->name('notifications.store');
                });

                // Employees & Users Management
                Route::get('employees', [\App\Http\Controllers\Tenant\EmployeeController::class, 'index'])->name('employees.index');
                Route::post('employees', [\App\Http\Controllers\Tenant\EmployeeController::class, 'store'])->name('employees.store');
                Route::get('employees/{employee}', [\App\Http\Controllers\Tenant\EmployeeController::class, 'show'])->name('employees.show');
                Route::put('employees/{user}', [\App\Http\Controllers\Tenant\EmployeeController::class, 'update'])->name('employees.update');
                Route::delete('employees/{user}', [\App\Http\Controllers\Tenant\EmployeeController::class, 'destroy'])->name('employees.destroy');
                Route::post('employees/{user}/reset-password', [\App\Http\Controllers\Tenant\EmployeeController::class, 'resetPassword'])->name('employees.reset-password');
                Route::post('employees/{user}/toggle-status', [\App\Http\Controllers\Tenant\EmployeeController::class, 'toggleStatus'])->name('employees.toggle-status');
                Route::delete('employees/{user}', [\App\Http\Controllers\Tenant\EmployeeController::class, 'destroy'])->name('employees.destroy');
                Route::post('employees/{user}/reset-password', [\App\Http\Controllers\Tenant\EmployeeController::class, 'resetPassword'])->name('employees.reset-password');
                Route::post('employees/{user}/toggle-status', [\App\Http\Controllers\Tenant\EmployeeController::class, 'toggleStatus'])->name('employees.toggle-status');

                // Roles & Permissions Management
                Route::get('roles-permissions', [\App\Http\Controllers\Tenant\EmployeeController::class, 'rolesPermissions'])->name('roles-permissions');
                Route::post('roles', [\App\Http\Controllers\Tenant\RoleController::class, 'store'])->name('roles.store');
                Route::put('roles/{role}', [\App\Http\Controllers\Tenant\RoleController::class, 'update'])->name('roles.update');
                Route::delete('roles/{role}', [\App\Http\Controllers\Tenant\RoleController::class, 'destroy'])->name('roles.destroy');

                Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
                Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
                Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');
                Route::post('/profile/preferences', [\App\Http\Controllers\ProfileController::class, 'updatePreferences'])->name('profile.preferences.update');
                Route::post('/profile/password', [\App\Http\Controllers\ProfileController::class, 'updateSecurePassword'])->name('profile.password.update');

                // Activity Log
                Route::get('/activity-log', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-log.index');
                Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-logs.index');

                // SaaS Management
                Route::get('/saas/settings', [\App\Http\Controllers\SaaSSettingController::class, 'index'])->name('saas.settings.index');
                Route::post('/saas/settings', [\App\Http\Controllers\SaaSSettingController::class, 'store'])->name('saas.settings.store');
                Route::post('/saas/settings/logo', [\App\Http\Controllers\SaaSSettingController::class, 'uploadLogo'])->name('saas.settings.logo');
                Route::post('/saas/settings/watermark', [\App\Http\Controllers\SaaSSettingController::class, 'uploadWatermark'])->name('saas.settings.watermark');
                Route::delete('/saas/settings/watermark', [\App\Http\Controllers\SaaSSettingController::class, 'removeWatermark'])->name('saas.settings.watermark.remove');
                Route::post('/saas/settings/pdf-settings', [\App\Http\Controllers\SaaSSettingController::class, 'updatePdfSettings'])->name('saas.settings.pdf-settings');

                Route::get('/saas/themes', [\App\Http\Controllers\SaaSController::class, 'themes'])->name('saas.themes');
                Route::post('/saas/themes', [\App\Http\Controllers\SaaSController::class, 'updateThemes'])->name('saas.themes.update');
                Route::get('/saas/geo-settings', [\App\Http\Controllers\SaaSController::class, 'geoSettings'])->name('saas.geo-settings');
                Route::get('/saas/notification-settings', [\App\Http\Controllers\Settings\NotificationSettingsController::class, 'index'])->name('saas.notification-settings');
                Route::post('/saas/notification-settings', [\App\Http\Controllers\Settings\NotificationSettingsController::class, 'store'])->name('saas.notification-settings.update');
                Route::get('/saas/roles-permissions', [\App\Http\Controllers\Tenant\EmployeeController::class, 'rolesPermissions'])->name('saas.roles-permissions');
                Route::post('/saas/roles-permissions', [\App\Http\Controllers\Tenant\RoleController::class, 'store'])->name('saas.roles-permissions.update');
                Route::get('/saas/contract-settings', [\App\Http\Controllers\SaaSController::class, 'contractSettings'])->name('saas.contract-settings');
                Route::post('/saas/contract-settings', [\App\Http\Controllers\SaaSController::class, 'updateContractSettings'])->name('saas.contract-settings.update');

                // Countries Management
                Route::get('countries', [\App\Http\Controllers\CountryController::class, 'index'])->name('countries.index');
                Route::post('countries', [\App\Http\Controllers\CountryController::class, 'store'])->name('countries.store');
                Route::put('countries/{country}', [\App\Http\Controllers\CountryController::class, 'update'])->name('countries.update');
                Route::delete('countries/{country}', [\App\Http\Controllers\CountryController::class, 'destroy'])->name('countries.destroy');
                Route::post('countries/{country}/cities', [\App\Http\Controllers\CountryController::class, 'storeCity'])->name('countries.cities.store');
                Route::put('countries/{country}/cities/{city}', [\App\Http\Controllers\CountryController::class, 'updateCity'])->name('countries.cities.update');
                Route::delete('countries/{country}/cities/{city}', [\App\Http\Controllers\CountryController::class, 'destroyCity'])->name('countries.cities.destroy');

                // Sales System
                Route::get('sales/dashboard', [\App\Http\Controllers\Sales\SalesDashboardController::class, 'index'])->name('sales.dashboard');
                Route::resource('sales/categories', \App\Http\Controllers\Sales\SalesCategoryController::class, ['names' => 'sales.categories']);
                Route::resource('sales/invoices', \App\Http\Controllers\Sales\SalesInvoiceController::class, ['names' => 'sales.invoices']);
                Route::get('sales/invoices/{invoice}/print', [\App\Http\Controllers\Sales\SalesInvoiceController::class, 'print'])->name('sales.invoices.print');
            });
        });
    });
});
