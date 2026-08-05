<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractSetting;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\InventoryEntry;
use App\Models\QueueTicket;
use App\Models\Reception;
use App\Models\Delivery;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QueueTicketController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->toDateString();
        
        $tickets = QueueTicket::with(['customer', 'contract', 'driver', 'creator'])
            ->orderBy('ticket_date', 'desc')
            ->orderBy('daily_sequence', 'desc')
            ->paginate(15);

        $customers = Customer::select('id', 'name', 'phone_number')->orderBy('name')->get();
        $drivers = Driver::select('id', 'name', 'phone_number', 'vehicle_plate')->orderBy('name')->get();

        return Inertia::render('Warehouse/QueueTickets/Index', [
            'tickets'   => $tickets,
            'customers' => $customers,
            'drivers'   => $drivers,
        ]);
    }

    private function getPalletBreakdown(Contract $contract, $activePeriod)
    {
        $smallContracted = 0;
        $largeContracted = 0;

        // Fetch items from active period if available, otherwise from contract items
        $items = collect();
        if ($activePeriod) {
            $items = $activePeriod->items()->with('storageItem')->get();
        }
        if ($items->isEmpty()) {
            $items = $contract->items()->with('storageItem')->get();
        }

        foreach ($items as $item) {
            $storageName = mb_strtolower(($item->storageItem->name_ar ?? '') . ' ' . ($item->storageItem->name_en ?? '') . ' ' . ($item->storageItem->code ?? ''));
            $unitCount = (int) ($item->unit_count ?? 0);

            if (mb_strpos($storageName, 'صغير') !== false || mb_strpos($storageName, 'small') !== false || mb_strpos($storageName, 'sm') !== false) {
                $smallContracted += $unitCount;
            } elseif (mb_strpos($storageName, 'كبير') !== false || mb_strpos($storageName, 'large') !== false || mb_strpos($storageName, 'lg') !== false) {
                $largeContracted += $unitCount;
            } else {
                // If generic pallet item, add to total
                if ($smallContracted == 0 && $largeContracted == 0) {
                    $smallContracted += (int) ceil($unitCount * 0.5);
                    $largeContracted += (int) floor($unitCount * 0.5);
                }
            }
        }

        // If items were empty but total_capacity is set, fallback
        if ($smallContracted == 0 && $largeContracted == 0 && $contract->total_capacity > 0) {
            $total = (int) $contract->total_capacity;
            $smallContracted = (int) ceil($total * 0.5);
            $largeContracted = (int) floor($total * 0.5);
        }

        // Calculate utilized per size
        $receptionIds = Reception::where('contract_id', $contract->id)->pluck('id');
        $deliveryIds = Delivery::where('contract_id', $contract->id)->pluck('id');

        $entries = InventoryEntry::where(function ($q) use ($receptionIds, $deliveryIds) {
            $q->where(function ($q1) use ($receptionIds) {
                $q1->where('voucher_type', Reception::class)->whereIn('voucher_id', $receptionIds);
            })->orWhere(function ($q2) use ($deliveryIds) {
                $q2->where('voucher_type', Delivery::class)->whereIn('voucher_id', $deliveryIds);
            });
        })->with('pallet')->get();

        $smallUtilized = 0;
        $largeUtilized = 0;

        foreach ($entries as $entry) {
            $size = mb_strtolower($entry->pallet->size ?? '');
            if (mb_strpos($size, 'صغير') !== false || mb_strpos($size, 'small') !== false) {
                $smallUtilized++;
            } elseif (mb_strpos($size, 'كبير') !== false || mb_strpos($size, 'large') !== false) {
                $largeUtilized++;
            }
        }

        $smallRemaining = max(0, $smallContracted - $smallUtilized);
        $largeRemaining = max(0, $largeContracted - $largeUtilized);

        return [
            'small' => $smallRemaining,
            'large' => $largeRemaining,
            'small_contracted' => $smallContracted,
            'large_contracted' => $largeContracted,
            'small_utilized' => $smallUtilized,
            'large_utilized' => $largeUtilized,
        ];
    }

    public function getContractInfo(Contract $contract)
    {
        $contract->load(['customer', 'periods']);

        // Check active period
        $activePeriod = $contract->periods()
            ->where('status', 'active')
            ->orderBy('period_number', 'asc')
            ->first();

        if (!$activePeriod) {
            // Check if any period spans today
            $todayStr = Carbon::today()->toDateString();
            $activePeriod = $contract->periods()
                ->where('start_date', '<=', $todayStr)
                ->where('end_date', '>=', $todayStr)
                ->first();
        }

        // Calculate occupancy / empty pallet balance
        $bookedPallets = $contract->total_capacity ?: 0;
        
        $utilizedPallets = InventoryEntry::where(function ($q) use ($contract) {
            $q->where(function ($q1) use ($contract) {
                $q1->where('voucher_type', Reception::class)
                    ->whereIn('voucher_id', Reception::where('contract_id', $contract->id)->pluck('id'));
            })->orWhere(function ($q2) use ($contract) {
                $q2->where('voucher_type', Delivery::class)
                    ->whereIn('voucher_id', Delivery::where('contract_id', $contract->id)->pluck('id'));
            });
        })
            ->select('pallet_id')
            ->groupBy('pallet_id')
            ->having(DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
            ->get()
            ->count();

        $remainingBalance = max(0, $bookedPallets - $utilizedPallets);

        // Accurate Small & Large pallet balances breakdown from contract items
        $breakdown = $this->getPalletBreakdown($contract, $activePeriod);

        return response()->json([
            'contract_id'             => $contract->id,
            'contract_number'         => $contract->contract_number,
            'contract_number_suffix'  => substr($contract->contract_number, -3),
            'has_active_period'       => !is_null($activePeriod),
            'active_period'           => $activePeriod,
            'booked_pallets'          => $bookedPallets,
            'utilized_pallets'        => $utilizedPallets,
            'remaining_balance'       => $remainingBalance,
            'small_balance'           => $breakdown['small'],
            'large_balance'           => $breakdown['large'],
            'customer_name'           => $contract->customer ? $contract->customer->name : '',
        ]);
    }

    public function getCustomerContracts(Customer $customer)
    {
        $contracts = Contract::where('customer_id', $customer->id)
            ->select('id', 'contract_number', 'status', 'total_capacity')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($contracts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'    => 'required|exists:customers,id',
            'contract_id'    => 'required|exists:contracts,id',
            'driver_name'    => 'required|string|max:255',
            'driver_id'      => 'nullable|exists:drivers,id',
            'estimated_load' => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
        ], [
            'customer_id.required' => 'يرجى اختيار العميل.',
            'contract_id.required' => 'يرجى اختيار العقد.',
            'driver_name.required' => 'يرجى إدخال أو اختيار اسم السائق.',
        ]);

        $contract = Contract::with('periods')->findOrFail($validated['contract_id']);

        // 1. Verify Active Period
        $activePeriod = $contract->periods()
            ->where('status', 'active')
            ->first();

        if (!$activePeriod) {
            $todayStr = Carbon::today()->toDateString();
            $activePeriod = $contract->periods()
                ->where('start_date', '<=', $todayStr)
                ->where('end_date', '>=', $todayStr)
                ->first();
        }

        if (!$activePeriod) {
            return back()->withErrors([
                'contract_id' => 'عذراً، لا توجة فترة إلزامية نشطة لهذا العقد! يرجى توجيه السائق إلى الإدارة.',
            ]);
        }

        // 2. Verify Remaining Pallets Balance
        $bookedPallets = $contract->total_capacity ?: 0;
        $utilizedPallets = InventoryEntry::where(function ($q) use ($contract) {
            $q->where(function ($q1) use ($contract) {
                $q1->where('voucher_type', Reception::class)
                    ->whereIn('voucher_id', Reception::where('contract_id', $contract->id)->pluck('id'));
            })->orWhere(function ($q2) use ($contract) {
                $q2->where('voucher_type', Delivery::class)
                    ->whereIn('voucher_id', Delivery::where('contract_id', $contract->id)->pluck('id'));
            });
        })
            ->select('pallet_id')
            ->groupBy('pallet_id')
            ->having(DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
            ->get()
            ->count();

        $remainingBalance = max(0, $bookedPallets - $utilizedPallets);

        if ($bookedPallets > 0 && $remainingBalance <= 0) {
            return back()->withErrors([
                'contract_id' => 'عذراً، رصيد الطبالي المتبقية على العقد منتهي! يرجى توجيه السائق إلى الإدارة.',
            ]);
        }

        // 3. Compute Daily Sequence
        $todayDate = Carbon::today()->toDateString();
        $maxSeq = QueueTicket::where('ticket_date', $todayDate)->max('daily_sequence') ?: 0;
        $dailySequence = $maxSeq + 1;

        // 4. Compute Contract Suffix & Dates
        $contractSuffix = substr($contract->contract_number, -3);
        $dayTimeStr = Carbon::now()->format('D – H:i:s'); // e.g. "Wed – 13:43:25"
        $hijriDate = $this->getHijriDate(Carbon::now());

        // Pallet Breakdown from contracted items
        $breakdown = $this->getPalletBreakdown($contract, $activePeriod);

        $ticket = QueueTicket::create([
            'ticket_date'            => $todayDate,
            'daily_sequence'         => $dailySequence,
            'customer_id'            => $validated['customer_id'],
            'contract_id'            => $validated['contract_id'],
            'period_id'              => $activePeriod->id,
            'driver_id'              => $validated['driver_id'] ?? null,
            'driver_name'            => $validated['driver_name'],
            'estimated_load'         => $validated['estimated_load'] ?? null,
            'contract_number_suffix' => $contractSuffix,
            'day_time_str'           => $dayTimeStr,
            'date_hijri'             => $hijriDate,
            'pallet_balances'        => [
                'small' => $breakdown['small'],
                'large' => $breakdown['large'],
                'total' => $remainingBalance,
            ],
            'notes'                  => $validated['notes'] ?? null,
            'created_by'             => auth()->id(),
        ]);

        if ($request->input('redirect_to') === 'print') {
            return redirect()->route('queue-tickets.print', $ticket->id);
        }

        return redirect()->route('queue-tickets.print', $ticket->id)->with('success', 'تم إصدار رقم الانتظار بنجاح.');
    }

    public function print(QueueTicket $queueTicket)
    {
        $queueTicket->load(['customer', 'contract.items.storageItem', 'contract.periods.items.storageItem', 'driver', 'period', 'creator']);
        $companySettings = ContractSetting::pluck('value', 'key')->all();

        // Always compute live breakdown for the contract to guarantee exact contract items accuracy
        $activePeriod = $queueTicket->period ?: ($queueTicket->contract ? $queueTicket->contract->periods()->where('status', 'active')->first() : null);
        if ($queueTicket->contract) {
            $breakdown = $this->getPalletBreakdown($queueTicket->contract, $activePeriod);

            $balances = [
                'small' => $breakdown['small'],
                'large' => $breakdown['large'],
                'total' => $breakdown['small'] + $breakdown['large'],
            ];

            $queueTicket->pallet_balances = $balances;
            $queueTicket->update(['pallet_balances' => $balances]);
        }

        $queueTicket->zpl_code = $this->generateZplCode($queueTicket);

        return Inertia::render('Warehouse/QueueTickets/Print', [
            'ticket'          => $queueTicket,
            'companySettings' => $companySettings,
        ]);
    }

    public function generateZplCode(QueueTicket $ticket)
    {
        $smallCount    = $ticket->pallet_balances['small'] ?? 140;
        $largeCount    = $ticket->pallet_balances['large'] ?? 120;
        $sequenceNo    = str_pad($ticket->daily_sequence, 2, '0', STR_PAD_LEFT);
        $contractNo    = $ticket->contract_number_suffix ?? '236';
        $driverName    = $ticket->driver_name ?? 'Driver';
        $estimatedLoad = $ticket->estimated_load ? " | Load: " . $ticket->estimated_load : '';
        $customerName  = $ticket->customer ? $ticket->customer->name : '';
        $dateTime      = $ticket->day_time_str ?? '';
        $gregDate      = $ticket->ticket_date ? (is_string($ticket->ticket_date) ? $ticket->ticket_date : $ticket->ticket_date->format('Y-m-d')) : '';
        $hijriDate     = $ticket->date_hijri ?? '';

        return "^XA
^PW1200
^LL800
^LH0,0

;--- SM Pallets Box ---
^FO40,30^GB180,130,3,B,4^FS
^FO65,15^FR^FO70,18^A0N,22,22^FDSM^FS
^FO65,60^A0N,70,60^FD{$smallCount}^FS

;--- LG Pallets Box ---
^FO240,30^GB180,130,3,B,4^FS
^FO265,15^FR^FO270,18^A0N,22,22^FDLG^FS
^FO265,60^A0N,70,60^FD{$largeCount}^FS

;--- Sequence Box (01) ---
^FO40,190^GB380,310,4,B,6^FS
^FO70,230^A0N,180,150^FD{$sequenceNo}^FS

;--- Contract Suffix Box (236) ---
^FO450,190^GB710,530,5,B,8^FS
^FO480,240^A0N,240,210^FD{$contractNo}^FS

;--- Dates ---
^FO60,530^A0N,45,45^FD{$gregDate}^FS
^FO60,600^A0N,45,45^FD{$hijriDate}^FS

;--- Driver & Customer Details ---
^FO460,40^A0N,32,32^FDDriver: {$driverName}{$estimatedLoad}^FS
^FO460,90^A0N,42,42^FD{$dateTime}^FS
^FO460,145^A0N,30,30^FDCustomer: {$customerName}^FS

^XZ";
    }

    private function getHijriDate($date)
    {
        try {
            if (class_exists('\IntlDateFormatter')) {
                $fmt = new \IntlDateFormatter(
                    'ar_SA@calendar=islamic-umalqura',
                    \IntlDateFormatter::FULL,
                    \IntlDateFormatter::NONE,
                    'Asia/Riyadh',
                    \IntlDateFormatter::TRADITIONAL,
                    'dd/MM/yyyy'
                );
                return $fmt->format($date->timestamp);
            }
        } catch (\Exception $e) {
            // fallback calculation
        }
        return $date->format('d/m/Y');
    }
}
