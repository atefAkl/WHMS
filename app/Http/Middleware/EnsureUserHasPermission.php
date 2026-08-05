<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (!$user) {
            return $next($request);
        }

        // مدير النظام وصاحب المنشأة يتخطى جميع فحوصات الصلاحيات
        $isManager = (bool)$user->is_admin;
        if ($isManager) {
            return $next($request);
        }

        $routeName = $request->route() ? $request->route()->getName() : null;
        if (!$routeName) {
            return $next($request);
        }

        // خريطة الربط بين أسماء المسارات البرمجية والصلاحيات المطلوبة في النظام
        $routePermissionMap = [
            // العقود والعملاء (Contracts & Customers)
            'contracts.index'   => 'contracts.view',
            'contracts.show'    => 'contracts.view',
            'contracts.create'  => 'contracts.create',
            'contracts.store'   => 'contracts.create',
            'contracts.update'  => 'contracts.edit',
            'contracts.destroy' => 'contracts.delete',
            'contracts.activate'=> 'contracts.activate',
            'contracts.suspend' => 'contracts.activate',
            'contracts.end'     => 'contracts.activate',
            'contracts.cancel'  => 'contracts.activate',

            'customers.index'   => 'customers.view',
            'customers.show'    => 'customers.view',
            'customers.store'   => 'customers.create',
            'customers.update'  => 'customers.edit',
            'customers.destroy' => 'customers.delete',

            // العمليات المخزنية والطبالي (Pallets & Inventory)
            'pallets.index'   => 'pallets.view',
            'pallets.show'    => 'pallets.view',
            'pallets.store'   => 'pallets.create',
            'pallets.update'  => 'pallets.edit',
            'pallets.destroy' => 'pallets.delete',

            'inventory-items.index'   => 'inventory-items.view',
            'inventory-items.show'    => 'inventory-items.view',
            'inventory-items.store'   => 'inventory-items.create',
            'inventory-items.update'  => 'inventory-items.edit',
            'inventory-items.destroy' => 'inventory-items.delete',
            'inventory-item-variants.update' => 'inventory-items.edit',

            // سندات الاستلام (Receptions)
            'receptions.index'   => 'receptions.view',
            'receptions.show'    => 'receptions.view',
            'receptions.store'   => 'receptions.create',
            'receptions.update'  => 'receptions.edit',
            'receptions.destroy' => 'receptions.delete',
            'receptions.approve' => 'receptions.approve',

            // أذونات الخروج (Exit Authorizations)
            'exit-authorizations.index'   => 'exit_authorizations.view',
            'exit-authorizations.show'    => 'exit_authorizations.view',
            'exit-authorizations.store'   => 'exit_authorizations.create',
            'exit-authorizations.update'  => 'exit_authorizations.edit',
            'exit-authorizations.destroy' => 'exit_authorizations.delete',
            'exit-authorizations.approve' => 'exit_authorizations.approve',

            // سندات التسليم (Deliveries)
            'deliveries.index'   => 'deliveries.view',
            'deliveries.show'    => 'deliveries.view',
            'deliveries.store'   => 'deliveries.create',
            'deliveries.update'  => 'deliveries.edit',
            'deliveries.destroy' => 'deliveries.delete',
            'deliveries.approve' => 'deliveries.approve',

            // اللوحة المالية والتقارير المحاسبية (Accounting)
            'accounting.index'                     => 'accounting.view',
            'accounting.accounts.index'            => 'accounting.view',
            'accounting.accounts.store'            => 'accounting.create',
            'accounting.accounts.update'           => 'accounting.edit',
            'accounting.accounts.destroy'          => 'accounting.delete',
            'accounting.financial-vouchers.index'  => 'accounting.view',
            'accounting.financial-vouchers.store'  => 'accounting.create',
            'accounting.financial-vouchers.update' => 'accounting.edit',
            'accounting.financial-vouchers.destroy'=> 'accounting.delete',
            'accounting.financial-vouchers.approve'=> 'accounting.approve',
            'accounting.financial-vouchers.unapprove'=> 'accounting.approve',
            'accounting.journal-entries.index'     => 'accounting.view',
            'accounting.journal-entries.store'     => 'accounting.create',
            'accounting.journal-entries.update'    => 'accounting.edit',
            'accounting.journal-entries.destroy'   => 'accounting.delete',
            'accounting.journal-entries.post'      => 'accounting.approve',
            'accounting.reports.account-statement' => 'accounting.view',
            'accounting.reports.trial-balance'     => 'accounting.view',
            'accounting.reports.income-statement'  => 'accounting.view',

            // الإعدادات العامة للمستودع (Settings)
            'settings.index'                       => 'settings.view',
            'settings.general.index'               => 'settings.view',
            'settings.general.store'               => 'settings.edit',
            'settings.seasons.index'               => 'settings.view',
            'settings.seasons.store'               => 'settings.edit',
            'settings.seasons.update'              => 'settings.edit',
            
            // إدارة الموظفين
            'employees.index'                      => 'employees.view',
            'employees.store'                      => 'employees.create',
            'employees.update'                     => 'employees.edit',
            'employees.destroy'                    => 'employees.delete',
        ];

        if (array_key_exists($routeName, $routePermissionMap)) {
            $requiredPermission = $routePermissionMap[$routeName];
            
            try {
                // التحقق من امتلاك الموظف للصلاحية القياسية المطلوبة
                if (!$user->hasPermissionTo($requiredPermission)) {
                    $message = 'عذراً، لا تمتلك الصلاحية الكافية لإتمام هذا الإجراء أو تصفح هذه الصفحة.';
                    if ($request->isMethod('get') && $routeName !== 'dashboard') {
                        return redirect()->route('dashboard')->with('error', $message);
                    }
                    return redirect()->back()->with('error', $message);
                }
            } catch (\Exception $e) {
                // في حال عدم بذر الصلاحيات بقاعدة البيانات نمرر الطلب مؤقتاً
                return $next($request);
            }
        }

        return $next($request);
    }
}
