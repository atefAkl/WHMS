<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TenantRolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. قائمة كامل الصلاحيات في النظام
        $permissions = [
            // العقود والعملاء
            'contracts.view',
            'contracts.create',
            'contracts.edit',
            'contracts.delete',
            'contracts.activate',
            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',

            // العمليات المخزنية والطبالي
            'pallets.view',
            'pallets.create',
            'pallets.edit',
            'pallets.delete',
            'inventory-items.view',
            'inventory-items.create',
            'inventory-items.edit',
            'inventory-items.delete',

            // سندات الاستلام وأذونات الحركة
            'receptions.view',
            'receptions.create',
            'receptions.edit',
            'receptions.delete',
            'receptions.approve',
            'exit_authorizations.view',
            'exit_authorizations.create',
            'exit_authorizations.edit',
            'exit_authorizations.delete',
            'exit_authorizations.approve',
            'deliveries.view',
            'deliveries.create',
            'deliveries.edit',
            'deliveries.delete',
            'deliveries.approve',

            // الحسابات والمالية
            'accounting.view',
            'accounting.create',
            'accounting.edit',
            'accounting.delete',
            'accounting.approve',

            // الإعدادات العامة للمنشأة والموظفين
            'settings.view',
            'settings.edit',
            'employees.view',
            'employees.create',
            'employees.edit',
            'employees.delete'
        ];

        // إنشاء الصلاحيات إذا لم تكن موجودة مسبقاً
        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }

        // 2. إنشاء الأدوار الوظيفية
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $warehouseKeeper = Role::firstOrCreate(['name' => 'Warehouse Keeper', 'guard_name' => 'web']);
        $accountant = Role::firstOrCreate(['name' => 'Accountant', 'guard_name' => 'web']);
        $worker = Role::firstOrCreate(['name' => 'Worker', 'guard_name' => 'web']);

        // 3. توزيع الصلاحيات على الأدوار
        // Super Admin يحصل على كامل الصلاحيات تلقائياً
        $superAdmin->syncPermissions($permissions);

        // أمين مستودع (صلاحيات تشغيل العمليات المخزنية فقط)
        $warehouseKeeper->syncPermissions([
            'pallets.view',
            'pallets.create',
            'pallets.edit',
            'inventory-items.view',
            'receptions.view',
            'receptions.create',
            'receptions.edit',
            'exit_authorizations.view',
            'exit_authorizations.create',
            'exit_authorizations.edit',
            'deliveries.view',
            'deliveries.create',
            'deliveries.edit',
        ]);

        // المحاسب المالي (الفوترة، القيود والمالية، وإدارة العقود ماليّاً)
        $accountant->syncPermissions([
            'contracts.view',
            'contracts.create',
            'contracts.edit',
            'contracts.activate',
            'customers.view',
            'customers.create',
            'customers.edit',
            'receptions.view',
            'receptions.approve',
            'exit_authorizations.view',
            'exit_authorizations.approve',
            'deliveries.view',
            'deliveries.approve',
            'accounting.view',
            'accounting.create',
            'accounting.edit',
            'accounting.approve',
        ]);

        // موظف عادي (العرض فقط للمخزون)
        $worker->syncPermissions([
            'pallets.view',
            'inventory-items.view',
            'receptions.view',
            'exit_authorizations.view',
            'deliveries.view',
        ]);

        // 4. تعيين أول مستخدم في قاعدة بيانات المستأجر كـ Super Admin
        // بدل الاعتماد على ID = 1 (قد لا يكون معروفاً بعد إنشاء المستخدم)
        try {
            $tenantUser = User::orderBy('id')->first();
            if ($tenantUser) {
                $tenantUser->is_admin = true;
                $tenantUser->save();
                if (method_exists($tenantUser, 'assignRole')) {
                    $tenantUser->assignRole($superAdmin);
                }
            }
        } catch (\Throwable $e) {
            // لو فشل الوصول للمستخدم داخل التينانت، سجّل التحذير ولكن لا توقف التنفيذ
            \Illuminate\Support\Facades\Log::warning('TenantRolesAndPermissionsSeeder: failed to assign Super Admin role', ['message' => $e->getMessage()]);
        }
    }
}
