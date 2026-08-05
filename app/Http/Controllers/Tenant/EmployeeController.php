<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Employee;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $currentUser = auth()->user();
        
        // Fetch all Users (who log in) except the active user
        $users = User::where('id', '!=', $currentUser->id)->latest()->get()->map(function ($user) {
            $user->is_manager = (bool) $user->is_admin;
            $user->role = $user->roles->first()?->name;
            return $user;
        });

        // Fetch all Employees (non-login staff)
        $employees = Employee::latest()->get()->map(function ($emp) {
            $emp->is_manager = false;
            $emp->role = null;
            return $emp;
        });

        return Inertia::render('Tenant/Employees/Index', [
            'managers' => $users, // Left as "managers" to keep frontend compatibility with the Users tab
            'employees' => $employees,
            'isManager' => (bool)$currentUser->is_admin,
            'roles' => Role::all()->pluck('name')->toArray(),
        ]);
    }

    public function rolesPermissions(Request $request)
    {
        $currentUser = auth()->user();
        $this->authorizeManager();

        $users = User::latest()->get()->map(function ($user) {
            $user->is_manager = (bool) $user->is_admin;
            $user->role = $user->roles->first()?->name;
            return $user;
        });

        $rolesWithPermissions = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray()
            ];
        });

        return Inertia::render('Tenant/Settings/RolesPermissions', [
            'users' => $users,
            'isManager' => (bool)$currentUser->is_admin,
            'roles' => $rolesWithPermissions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeManager();

        $isUser = $request->input('account_type') === 'user';

        if ($isUser) {
            $requestClass = StoreUserRequest::class;
            $validated = app($requestClass)->validated();

            $avatarPath = $request->input('avatar_gallery');
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                $filename = time() . '_avatar_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/avatars'), $filename);
                $avatarPath = '/uploads/avatars/' . $filename;
            }

            $user = User::create([
                'name'      => $validated['name'],
                'username'  => $validated['username'],
                'email'     => $validated['email'],
                'is_admin'  => (bool)$validated['is_admin'],
                'phone'     => $validated['phone'] ?? null,
                'id_number' => $validated['id_number'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'password'  => Hash::make($validated['password']),
                'avatar'    => $avatarPath,
            ]);

            if ((bool)$validated['is_admin']) {
                $user->assignRole('Super Admin');
            }
        } else {
            $requestClass = StoreEmployeeRequest::class;
            $validated = app($requestClass)->validated();

            $avatarPath = $request->input('avatar_gallery');
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                $filename = time() . '_avatar_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/avatars'), $filename);
                $avatarPath = '/uploads/avatars/' . $filename;
            }

            Employee::create([
                'name'      => $validated['name'],
                'email'     => $validated['email'] ?? null,
                'phone'     => $validated['phone'],
                'id_number' => $validated['id_number'],
                'job_title' => $validated['job_title'],
                'avatar'    => $avatarPath,
            ]);
        }

        if ($request->wantsJson()) {
            return $this->successResponse(null, 'تم الحفظ بنجاح.');
        }

        return redirect()->back()->with('success', 'تم الحفظ بنجاح.');
    }

    public function show(Request $request, $id)
    {
        $this->authorizeManager();
        $type = $request->query('type', 'user');

        // Scan avatar library files on the server
        $avatarFiles = [];
        $avatarDir = public_path('uploads/avatars');
        if (file_exists($avatarDir)) {
            $files = glob($avatarDir . '/*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE);
            if ($files) {
                foreach ($files as $file) {
                    $avatarFiles[] = '/uploads/avatars/' . basename($file);
                }
            }
        }
        $gallery = array_values(array_unique(array_filter(array_merge(
            $avatarFiles,
            User::whereNotNull('avatar')->pluck('avatar')->toArray(),
            Employee::whereNotNull('avatar')->pluck('avatar')->toArray()
        ))));

        if ($type === 'user') {
            $user = User::find($id);
            if (!$user) {
                return redirect()->route('employees.index')
                    ->with('error', 'المستخدم غير موجود أو ربما تم حذفه مسبقاً.');
            }
            $user->is_manager = (bool) $user->is_admin;
            $user->assigned_roles = $user->roles->pluck('name')->toArray();

            return Inertia::render('Tenant/Employees/Show', [
                'employee' => $user,
                'type' => 'user',
                'roles' => Role::all()->pluck('name')->toArray(),
                'avatarGallery' => $gallery,
            ]);
        } else {
            $employee = Employee::find($id);
            if (!$employee) {
                return redirect()->route('employees.index')
                    ->with('error', 'الموظف غير موجود أو ربما تم حذفه مسبقاً.');
            }
            $employee->is_manager = false;
            $employee->assigned_roles = [];

            return Inertia::render('Tenant/Employees/Show', [
                'employee' => $employee,
                'type' => 'employee',
                'roles' => [],
                'avatarGallery' => $gallery,
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $this->authorizeManager();
        $type = $request->input('type', 'user');

        if ($type === 'user') {
            $user = User::findOrFail($id);
            
            // Check if this is an AJAX/JSON request updating roles only
            if ($request->has('roles') && !$request->has('name')) {
                $validated = $request->validate([
                    'roles' => 'nullable|array',
                    'is_admin' => 'required|boolean',
                ]);
                
                $user->update(['is_admin' => (bool)$validated['is_admin']]);
                if ((bool)$validated['is_admin']) {
                    $user->syncRoles(['Super Admin']);
                } else {
                    $user->syncRoles($validated['roles'] ?? []);
                }

                if ($request->wantsJson()) {
                    return $this->successResponse(
                        ['roles' => $user->roles->pluck('name')->toArray()],
                        'تم تحديث أدوار المستخدم بنجاح.'
                    );
                }
                return redirect()->back()->with('success', 'تم تحديث أدوار المستخدم بنجاح.');
            }

            // Otherwise, validate complete profile details
            $requestClass = UpdateUserRequest::class;
            // Bind routing parameter dynamically so validator can access it
            $request->route()->setParameter('employee', $user);
            $validated = app($requestClass)->validated();

            $avatarPath = $request->input('avatar_gallery') ?: $user->avatar;
            if ($request->hasFile('avatar')) {
                if ($user->avatar && file_exists(public_path($user->avatar))) {
                    @unlink(public_path($user->avatar));
                }
                $file = $request->file('avatar');
                $filename = time() . '_avatar_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/avatars'), $filename);
                $avatarPath = '/uploads/avatars/' . $filename;
            }

            $user->update([
                'name'      => $validated['name'],
                'username'  => $validated['username'],
                'email'     => $validated['email'],
                'is_admin'  => (bool)$validated['is_admin'],
                'phone'     => $validated['phone'],
                'id_number' => $validated['id_number'],
                'job_title' => $validated['job_title'],
                'avatar'    => $avatarPath,
            ]);

            if ((bool)$validated['is_admin']) {
                $user->syncRoles(['Super Admin']);
            } else {
                $user->syncRoles($request->input('roles', []));
            }
        } else {
            $employee = Employee::findOrFail($id);
            $requestClass = UpdateEmployeeRequest::class;
            $validated = app($requestClass)->validated();

            $avatarPath = $request->input('avatar_gallery') ?: $employee->avatar;
            if ($request->hasFile('avatar')) {
                if ($employee->avatar && file_exists(public_path($employee->avatar))) {
                    @unlink(public_path($employee->avatar));
                }
                $file = $request->file('avatar');
                $filename = time() . '_avatar_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/avatars'), $filename);
                $avatarPath = '/uploads/avatars/' . $filename;
            }

            $employee->update([
                'name'      => $validated['name'],
                'email'     => $validated['email'] ?? null,
                'phone'     => $validated['phone'],
                'id_number' => $validated['id_number'],
                'job_title' => $validated['job_title'],
                'avatar'    => $avatarPath,
            ]);
        }

        if ($request->wantsJson()) {
            return $this->successResponse(null, 'تم تحديث البيانات بنجاح.');
        }

        return redirect()->back()->with('success', 'تم تحديث البيانات بنجاح.');
    }

    public function updatePassword(Request $request, $id)
    {
        $this->authorizeManager();

        $validated = $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ], [
            'password.required'  => 'يرجى إدخال كلمة المرور الجديدة.',
            'password.min'       => 'كلمة المرور يجب أن لا تقل عن 6 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        if ($request->wantsJson()) {
            return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح.');
        }

        return redirect()->back()->with('success', 'تم تغيير كلمة المرور بنجاح.');
    }

    public function updatePreferences(Request $request, $id)
    {
        $this->authorizeManager();

        $validated = $request->validate([
            'preferences' => 'required|array',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'preferences' => array_merge($user->preferences ?? [], $validated['preferences']),
        ]);

        if ($request->wantsJson()) {
            return $this->successResponse(null, 'تم تحديث التفضيلات بنجاح.');
        }

        return redirect()->back()->with('success', 'تم تحديث التفضيلات بنجاح.');
    }

    public function destroy(Request $request, $id)
    {
        $this->authorizeManager();
        $type = $request->input('type', 'user');

        if ($type === 'user') {
            $user = User::find($id);
            if (!$user) {
                return redirect()->route('employees.index')
                    ->with('error', 'المستخدم غير موجود.');
            }
            if ($user->id === auth()->id()) {
                if ($request->wantsJson()) {
                    return $this->errorResponse('لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول.');
                }
                return redirect()->back()->with('error', 'لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول.');
            }

            if ($user->avatar && file_exists(public_path($user->avatar))) {
                @unlink(public_path($user->avatar));
            }
            $user->delete();
        } else {
            $employee = Employee::find($id);
            if (!$employee) {
                return redirect()->route('employees.index')
                    ->with('error', 'الموظف غير موجود.');
            }
            if ($employee->avatar && file_exists(public_path($employee->avatar))) {
                @unlink(public_path($employee->avatar));
            }
            $employee->delete();
        }

        if ($request->wantsJson()) {
            return $this->successResponse(null, 'تم الحذف بنجاح.');
        }

        // Redirect to index — NOT back() to avoid landing on the deleted resource page
        return redirect()->route('employees.index')->with('success', 'تم الحذف بنجاح.');
    }

    private function isUserManager($user): bool
    {
        if (!$user) return false;
        return (bool) $user->is_admin;
    }

    private function authorizeManager()
    {
        if (!$this->isUserManager(auth()->user())) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(
                redirect()->route('dashboard')->with('error', 'غير مسموح لك بإجراء هذه العملية. الصلاحية تقتصر على مديري النظام فقط.')
            );
        }
    }
}
