<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function store(Request $request)
    {
        $this->authorizeManager();

        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:roles,name',
            'permissions' => 'present|array',
        ]);

        $role = Role::create([
            'name'       => $validated['name'],
            'guard_name' => 'web'
        ]);

        $role->syncPermissions($validated['permissions']);

        return redirect()->back()->with('success', 'تم إضافة الدور الجديد بنجاح.');
    }

    public function update(Request $request, Role $role)
    {
        $this->authorizeManager();

        if ($role->name === 'Super Admin') {
            return redirect()->back()->with('error', 'لا يمكن تعديل صلاحيات مدير النظام العام.');
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'present|array',
        ]);

        $role->update([
            'name' => $validated['name']
        ]);

        $role->syncPermissions($validated['permissions']);

        return redirect()->back()->with('success', 'تم تحديث الدور وصلاحياته بنجاح.');
    }

    public function destroy(Role $role)
    {
        $this->authorizeManager();

        if ($role->name === 'Super Admin') {
            return redirect()->back()->with('error', 'لا يمكن حذف دور مدير النظام العام لسلامة التشغيل.');
        }

        // Check if there are users assigned to this role
        if ($role->users()->exists()) {
            return redirect()->back()->with('error', 'لا يمكن حذف هذا الدور لوجود موظفين مرتبطين به حالياً.');
        }

        $role->delete();

        return redirect()->back()->with('success', 'تم حذف الدور بنجاح.');
    }

    private function authorizeManager()
    {
        $user = auth()->user();
        
        $isManager = $user && ($user->id === 1 || (bool)$user->is_admin);
        
        if (!$isManager) {
            abort(403, 'عذراً، هذه العملية متاحة فقط لمدراء النظام.');
        }
    }
}
