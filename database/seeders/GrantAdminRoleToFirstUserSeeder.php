<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class GrantAdminRoleToFirstUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. التأكد من وجود دور Super Admin
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);

        // 2. التحقق من وجود الحقل في قاعدة البيانات لتفادي استثناءات SQL
        if (!\Illuminate\Support\Facades\Schema::hasColumn('users', 'is_admin')) {
            if (isset($this->command)) {
                $this->command->error('خطأ: عمود "is_admin" غير موجود في جدول المستخدمين. يرجى تشغيل الميجريشن أولاً عن طريق الأمر: php artisan tenants:migrate');
            }
            return;
        }

        // 3. تحديث الموظف الأول وتعيينه كمدير
        $owner = User::find(1);
        if ($owner) {
            $owner->is_admin = true;
            $owner->save();
            $owner->assignRole($superAdmin);
            
            if (isset($this->command)) {
                $this->command->info('Successfully granted Super Admin role and set is_admin = true for User ID 1.');
            }
        } else {
            if (isset($this->command)) {
                $this->command->error('User ID 1 not found.');
            }
        }
    }
}
