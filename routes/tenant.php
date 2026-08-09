<?php

declare(strict_types=1);

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Foundation\Application;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    Route::get('/', function () {
        // If user is authenticated, send to the dashboard; otherwise show a public landing page.
        if (auth()->check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
    });

    require base_path('routes/auth.php');

    Route::get('/run-updates', function() {
        try {
            echo "<pre>Clearing cache...\n";
            \Illuminate\Support\Facades\Artisan::call('optimize:clear');
            echo \Illuminate\Support\Facades\Artisan::output() . "\n\n";

            echo "Running tenant migrations...\n";
            \Illuminate\Support\Facades\Artisan::call('tenants:migrate');
            echo \Illuminate\Support\Facades\Artisan::output() . "\n\n";

            echo "All updates completed successfully!</pre>";
        } catch (\Exception $e) {
            echo "Error: " . $e->getMessage();
        }
    });

    Route::middleware('guest')->group(function () {
        Route::get('/setup-password', [\App\Http\Controllers\TenantPasswordSetupController::class, 'show'])->name('tenant.password.setup');
        Route::post('/setup-password', [\App\Http\Controllers\TenantPasswordSetupController::class, 'store'])->name('tenant.password.store');
    });

    Route::middleware(['auth', 'permission.check'])->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::post('/profile/preferences', [ProfileController::class, 'updatePreferences'])->name('profile.preferences');
        Route::post('/profile/secure-password', [ProfileController::class, 'updateSecurePassword'])->name('profile.secure-password.update');

        Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-logs.index');

        // Employee Management CRUD
        Route::resource('employees', \App\Http\Controllers\Tenant\EmployeeController::class)->except(['create', 'edit']);
        Route::put('employees/{employee}/password', [\App\Http\Controllers\Tenant\EmployeeController::class, 'updatePassword'])->name('employees.password.update');
        Route::put('employees/{employee}/preferences', [\App\Http\Controllers\Tenant\EmployeeController::class, 'updatePreferences'])->name('employees.preferences.update');
        Route::get('settings/roles-permissions', [\App\Http\Controllers\Tenant\EmployeeController::class, 'rolesPermissions'])->name('settings.roles-permissions');
        Route::post('settings/roles', [\App\Http\Controllers\Tenant\RoleController::class, 'store'])->name('settings.roles.store');
        Route::put('settings/roles/{role}', [\App\Http\Controllers\Tenant\RoleController::class, 'update'])->name('settings.roles.update');
        Route::delete('settings/roles/{role}', [\App\Http\Controllers\Tenant\RoleController::class, 'destroy'])->name('settings.roles.destroy');

        // Notifications Center
        Route::get('notifications', function() {
            $user = auth()->user();
            $user->unreadNotifications->markAsRead();
            return Inertia::render('Tenant/Notifications/Index', [
                'notifications' => $user->notifications()->latest()->paginate(15)
            ]);
        })->name('notifications.index');
        Route::post('notifications/mark-all-read', function() {
            auth()->user()->unreadNotifications->markAsRead();
            return redirect()->back()->with('success', 'تم تحديد جميع التنبيهات كمقروءة.');
        })->name('notifications.markAllRead');
        Route::post('notifications/{id}/mark-read', function($id) {
            $notification = auth()->user()->notifications()->find($id);
            if ($notification && is_null($notification->read_at)) {
                $notification->markAsRead();
            }
            return response()->json(['success' => true]);
        })->name('notifications.markOneRead');
        Route::post('notifications/send-test', function() {
            auth()->user()->notify(new \App\Notifications\SystemNotification(
                'تنبيه تجريبي من النظام 🔔',
                'هذا إشعار تجريبي لاختبار وتأكيد وصول الإشعارات الفورية والتفاعلية بالنظام.',
                route('dashboard')
            ));
            return redirect()->back()->with('success', 'تم إرسال إشعار تجريبي بنجاح!');
        })->name('notifications.sendTest');
        Route::delete('notifications/clear-all', function() {
            auth()->user()->notifications()->delete();
            return redirect()->back()->with('success', 'تم حذف جميع التنبيهات.');
        })->name('notifications.clearAll');
        Route::get('/api/notifications/unread-count', function() {
            $user = auth()->user();
            if (!$user || !\Illuminate\Support\Facades\Schema::hasTable('notifications')) {
                return response()->json(['unread_count' => 0, 'recent' => []]);
            }
            return response()->json([
                'unread_count' => $user->unreadNotifications()->count(),
                'recent'       => $user->notifications()->latest()->limit(5)->get(),
            ]);
        })->name('api.notifications.unread-count');

        // System Notification Administration Settings
        Route::get('settings/notifications', [\App\Http\Controllers\Settings\NotificationSettingsController::class, 'index'])->name('settings.notifications.index');
        Route::post('settings/notifications', [\App\Http\Controllers\Settings\NotificationSettingsController::class, 'update'])->name('settings.notifications.update');

        // Customer Financial Status API (Strict Permission Checked)
        Route::get('/api/customers/{customer}/financial-status', function (\App\Models\Customer $customer) {
            $user = auth()->user();
            $canSee = $user->is_admin || $user->hasPermissionTo('see-client-financial-state') || $user->can('see-client-financial-state');
            if (!$canSee) {
                return response()->json(['allowed' => false, 'message' => 'غير مصرح بمشاهدة الموقف المالي.']);
            }

            $unpaidInvoices = \App\Models\SalesInvoice::where('customer_id', $customer->id)
                ->whereIn('status', ['posted', 'partially_paid', 'unpaid'])
                ->get();

            $totalUnpaid = $unpaidInvoices->sum('total_amount');
            $balance = $customer->account ? $customer->account->current_balance : 0;

            return response()->json([
                'allowed'      => true,
                'balance'      => $balance,
                'unpaid_count' => $unpaidInvoices->count(),
                'unpaid_total' => $totalUnpaid,
                'status_label' => $totalUnpaid > 0 ? 'يوجد فواتير مستحقة' : 'سليم / متزن',
            ]);
        })->name('api.customers.financial-status');

        // Contract Available Inventory API (Items, Variants, Pallets & Balances)
        Route::get('/api/contracts/{contract}/available-inventory', function (\App\Models\Contract $contract) {
            $pallets = \App\Models\Pallet::query()
                ->whereHas('inventoryEntries', function ($q) use ($contract) {
                    $q->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class, \App\Models\InventoryAdjustment::class], function ($query) use ($contract) {
                        $query->where('contract_id', $contract->id)->orWhere('customer_id', $contract->customer_id);
                    });
                })
                ->orWhere('customer_id', $contract->customer_id)
                ->orderBy('pallet_number', 'asc')
                ->get();

            $entries = \App\Models\InventoryEntry::whereIn('pallet_id', $pallets->pluck('id'))
                ->with(['inventoryItem', 'variant', 'pallet'])
                ->get();

            $entriesByPallet = $entries->groupBy('pallet_id');
            $result = [];

            foreach ($pallets as $pallet) {
                $palletEntries = $entriesByPallet->get($pallet->id, collect());
                if ($palletEntries->isEmpty()) {
                    $result[] = [
                        'inventory_item_id' => $pallet->inventory_item_id ?: 1,
                        'inventory_item_variant_id' => $pallet->inventory_item_variant_id ?: 1,
                        'pallet_id' => $pallet->id,
                        'available_qty' => $pallet->current_quantity ?? 0,
                        'inventoryItem' => $pallet->inventoryItem ? ['id' => $pallet->inventoryItem->id, 'name' => $pallet->inventoryItem->name, 'code' => $pallet->inventoryItem->code] : ['id' => 1, 'name' => 'صنف تمور', 'code' => 'DAT'],
                        'variant' => $pallet->variant ? ['id' => $pallet->variant->id, 'name' => $pallet->variant->name, 'code' => $pallet->variant->code] : ['id' => 1, 'name' => 'كرتون / درجة', 'code' => 'VAR'],
                        'pallet' => ['id' => $pallet->id, 'code' => $pallet->code, 'pallet_number' => $pallet->pallet_number]
                    ];
                    continue;
                }

                $grouped = $palletEntries->groupBy(function ($entry) {
                    return $entry->inventory_item_id . '_' . $entry->inventory_item_variant_id;
                });

                foreach ($grouped as $group) {
                    $first = $group->first();
                    $qtyIn = $group->sum('quantity_in');
                    $qtyOut = $group->sum('quantity_out');
                    $balance = $qtyIn - $qtyOut;

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
                            'pallet_number' => $pallet->pallet_number
                        ]
                    ];
                }
            }

            return response()->json($result);
        })->name('api.contracts.available-inventory');

        // Inventory Adjustments Vouchers (11 Code)
        Route::resource('inventory-adjustments', \App\Http\Controllers\Warehouse\InventoryAdjustmentController::class);
        Route::post('inventory-adjustments/{inventoryAdjustment}/approve', [\App\Http\Controllers\Warehouse\InventoryAdjustmentController::class, 'approve'])->name('inventory-adjustments.approve');

        // Tenant Onboarding / Setup
        Route::get('/tenant-setup', [\App\Http\Controllers\TenantSetupController::class, 'create'])->name('tenant.setup');
        Route::post('/tenant-setup', [\App\Http\Controllers\TenantSetupController::class, 'store'])->name('tenant.store');

        // API for settings
        Route::get('/api/settings', [\App\Http\Controllers\TenantSettingsController::class, 'index']);
        Route::post('/api/settings', [\App\Http\Controllers\TenantSettingsController::class, 'store']);

        // Routes that require a configured tenant
        Route::middleware('tenant')->group(function () {
            // Season Selection
            Route::get('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'create'])->name('season.select');
            Route::post('/select-season', [\App\Http\Controllers\SeasonSelectionController::class, 'store'])->name('season.store');

            // Routes that require an active season
            Route::middleware('season')->group(function () {
                Route::get('/dashboard', function () {
                    return Inertia::render('Dashboard');
                })->name('dashboard');

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
                Route::get('contracts/{contract}/stored-items', [\App\Http\Controllers\ContractController::class, 'getStoredItems'])->name('contracts.stored-items');
                Route::get('contracts/{contract}/item-movements', [\App\Http\Controllers\ContractController::class, 'getItemMovements'])->name('contracts.item-movements');
                Route::get('contracts/{contract}/pallet-movements', [\App\Http\Controllers\ContractController::class, 'getPalletMovements'])->name('contracts.pallet-movements');

                // Agents
                Route::get('agents', [\App\Http\Controllers\AgentController::class, 'index'])->name('agents.index');
                Route::post('agents', [\App\Http\Controllers\AgentController::class, 'store'])->name('agents.store');

                // Season-term assignment
                Route::get('seasons/{season}/terms', [\App\Http\Controllers\TermController::class, 'seasonTerms'])->name('seasons.terms.index');
                Route::post('seasons/{season}/terms/sync', [\App\Http\Controllers\TermController::class, 'syncSeasonTerms'])->name('seasons.terms.sync');
                Route::post('seasons/{season}/terms/reorder', [\App\Http\Controllers\TermController::class, 'reorderSeasonTerms'])->name('seasons.terms.reorder');
                // Drivers API
                Route::get('api/drivers', [\App\Http\Controllers\DriverController::class, 'index'])->name('api.drivers.index');
                Route::post('api/drivers', [\App\Http\Controllers\DriverController::class, 'store'])->name('api.drivers.store');

                // Queue Tickets
                Route::get('queue-tickets', [\App\Http\Controllers\Tenant\QueueTicketController::class, 'index'])->name('queue-tickets.index');
                Route::post('queue-tickets', [\App\Http\Controllers\Tenant\QueueTicketController::class, 'store'])->name('queue-tickets.store');
                Route::get('queue-tickets/{queueTicket}/print', [\App\Http\Controllers\Tenant\QueueTicketController::class, 'print'])->name('queue-tickets.print');
                Route::get('api/contracts/{contract}/queue-info', [\App\Http\Controllers\Tenant\QueueTicketController::class, 'getContractInfo'])->name('api.contracts.queue-info');
                Route::get('api/customers/{customer}/contracts', [\App\Http\Controllers\Tenant\QueueTicketController::class, 'getCustomerContracts'])->name('api.customers.contracts');

                // Receptions Vouchers
                Route::post('receptions/{reception}/approve', [\App\Http\Controllers\ReceptionController::class, 'approve'])->name('receptions.approve');
                Route::post('receptions/{reception}/reopen', [\App\Http\Controllers\ReceptionController::class, 'reopen'])->name('receptions.reopen');
                Route::post('receptions/{reception}/cancel', [\App\Http\Controllers\ReceptionController::class, 'cancel'])->name('receptions.cancel');
                Route::get('receptions/{reception}/print', [\App\Http\Controllers\ReceptionController::class, 'print'])->name('receptions.print');
                Route::resource('receptions', \App\Http\Controllers\ReceptionController::class);

                // Exit Authorizations
                Route::resource('exit-authorizations', \App\Http\Controllers\ExitAuthorizationController::class);

                // Deliveries
                Route::post('deliveries/{delivery}/approve', [\App\Http\Controllers\DeliveryController::class, 'approve'])->name('deliveries.approve');
                Route::post('deliveries/{delivery}/reopen', [\App\Http\Controllers\DeliveryController::class, 'reopen'])->name('deliveries.reopen');
                Route::post('deliveries/{delivery}/cancel', [\App\Http\Controllers\DeliveryController::class, 'cancel'])->name('deliveries.cancel');
                Route::get('deliveries/{delivery}/print', [\App\Http\Controllers\DeliveryController::class, 'print'])->name('deliveries.print');
                Route::resource('deliveries', \App\Http\Controllers\DeliveryController::class);

                // Progressive Loading API routes for Deliveries
                Route::get('api/contracts/{contract}/pallets', [\App\Http\Controllers\DeliveryController::class, 'getContractPallets'])->name('api.contracts.pallets');
                Route::get('api/contracts/{contract}/pallets/{pallet}/items', [\App\Http\Controllers\DeliveryController::class, 'getPalletItems'])->name('api.contracts.pallets.items');
                Route::get('api/contracts/{contract}/pallets/{pallet}/items/{item}/variants', [\App\Http\Controllers\DeliveryController::class, 'getItemVariants'])->name('api.contracts.pallets.items.variants');

                // Sales
                Route::prefix('sales')->name('sales.')->group(function () {
                    Route::post('services/bulk-destroy', [\App\Http\Controllers\Sales\ServiceController::class, 'bulkDestroy'])->name('services.bulk-destroy');
                    Route::post('services/bulk-status', [\App\Http\Controllers\Sales\ServiceController::class, 'bulkUpdateStatus'])->name('services.bulk-status');
                    Route::resource('services', \App\Http\Controllers\Sales\ServiceController::class);
                    
                    Route::post('services-categories', [\App\Http\Controllers\Sales\ServiceController::class, 'storeCategory'])->name('services-categories.store');
                    Route::put('services-categories/{category}', [\App\Http\Controllers\Sales\ServiceController::class, 'updateCategory'])->name('services-categories.update');
                    Route::delete('services-categories/{category}', [\App\Http\Controllers\Sales\ServiceController::class, 'destroyCategory'])->name('services-categories.destroy');

                    Route::post('invoices/{invoice}/approve', [\App\Http\Controllers\Accounting\SalesInvoiceController::class, 'approve'])->name('invoices.approve');
                    Route::post('invoices/{invoice}/unapprove', [\App\Http\Controllers\Accounting\SalesInvoiceController::class, 'unapprove'])->name('invoices.unapprove');
                    Route::resource('invoices', \App\Http\Controllers\Accounting\SalesInvoiceController::class);
                });

                // Settings Sub-module
                Route::prefix('settings')->name('settings.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\SettingsController::class, 'index'])->name('index');

                    Route::get('general', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'index'])->name('general.index');
                    Route::post('general', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'store'])->name('general.store');
                    Route::post('general/files', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'uploadFile'])->name('general.files.upload');
                    Route::delete('general/files/{id}', [\App\Http\Controllers\Settings\GeneralSettingsController::class, 'deleteFile'])->name('general.files.destroy');

                    Route::post('countries/seed', [\App\Http\Controllers\Settings\CountryController::class, 'seed'])->name('countries.seed');
                    Route::resource('countries', \App\Http\Controllers\Settings\CountryController::class)->except(['show', 'create', 'edit']);
                    Route::resource('categories', \App\Http\Controllers\Settings\CustomerCategoryController::class)->except(['show', 'create', 'edit']);
                    Route::resource('inventory-categories', \App\Http\Controllers\Settings\InventoryCategoryController::class)->parameters(['inventory-categories' => 'inventory_category'])->except(['show', 'create', 'edit']);
                    Route::resource('storage-items', \App\Http\Controllers\Settings\StorageItemController::class)->parameters(['storage-items' => 'storage_item'])->except(['show', 'create', 'edit']);
                    Route::post('terms/settings', [\App\Http\Controllers\Settings\TermController::class, 'updateSettings'])->name('terms.settings.update');
                    Route::resource('terms', \App\Http\Controllers\Settings\TermController::class)->except(['show', 'create', 'edit']);
                    Route::put('terms/blocks/{block}', [\App\Http\Controllers\Settings\TermController::class, 'updateBlock'])->name('terms.blocks.update');
                    Route::resource('seasons', \App\Http\Controllers\Settings\SeasonController::class)->except(['create', 'edit']);
                    Route::put('seasons/{season}/blocks/{block}', [\App\Http\Controllers\Settings\SeasonController::class, 'updateBlock'])->name('seasons.blocks.update');
                });

                // Accounting Sub-module
                Route::prefix('accounting')->name('accounting.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Accounting\DashboardController::class, 'index'])->name('index');
                    Route::resource('accounts', \App\Http\Controllers\Accounting\AccountController::class);
                    Route::post('financial-vouchers/{financial_voucher}/approve', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'approve'])->name('financial-vouchers.approve');
                    Route::post('financial-vouchers/{financial_voucher}/unapprove', [\App\Http\Controllers\Accounting\FinancialVoucherController::class, 'unapprove'])->name('financial-vouchers.unapprove');
                    Route::resource('financial-vouchers', \App\Http\Controllers\Accounting\FinancialVoucherController::class);
                    Route::post('journal-entries/bulk-action', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'bulkAction'])->name('journal-entries.bulk-action');
                    Route::post('journal-entries/{journal_entry}/post', [\App\Http\Controllers\Accounting\JournalEntryController::class, 'postEntry'])->name('journal-entries.post');
                    Route::resource('journal-entries', \App\Http\Controllers\Accounting\JournalEntryController::class);
                    
                    // Reports
                    Route::prefix('reports')->name('reports.')->group(function () {
                        Route::get('account-statement', [\App\Http\Controllers\Accounting\ReportController::class, 'accountStatement'])->name('account-statement');
                        Route::get('trial-balance', [\App\Http\Controllers\Accounting\ReportController::class, 'trialBalance'])->name('trial-balance');
                        Route::get('income-statement', [\App\Http\Controllers\Accounting\ReportController::class, 'incomeStatement'])->name('income-statement');
                    });
                });
            });
        });
    });
});
