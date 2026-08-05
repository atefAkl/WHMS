# Tenant Lifecycle & Spatie Permissions Setup Walkthrough

We have successfully simulated and tested the entire tenant lifecycle (Registration → Admin Approval → Database Provisioning → Tenant Setup) and integrated a standard, robust, database-driven **Spatie Roles & Permissions** system.

---

## 🔍 Roles & Permissions Integration Results

We have fully replaced the mock roles and preferences-based permissions system with the industry-standard `spatie/laravel-permission` package.

### 1. Database Migrations & Multi-Tenancy Routing
* **Migration File**: Moved Spatie's permission tables migration to the tenant directory:
  📁 [database/migrations/tenant/2026_08_02_095906_create_permission_tables.php](file:///C:/laragon/www/WHMS/database/migrations/tenant/2026_08_02_095906_create_permission_tables.php)
* **Local Schema Migration**: Executed `php artisan tenants:migrate --tenants=whms` locally. This successfully created Spatie's tables:
  * `roles`
  * `permissions`
  * `model_has_roles`
  * `model_has_permissions`
  * `role_has_permissions`
  inside the `tenantwhms` schema in our PostgreSQL database.

### 2. Seeding Default Roles & Permissions
* **Seeder File**: Created the seeder [TenantRolesAndPermissionsSeeder.php](file:///C:/laragon/www/WHMS/database/seeders/TenantRolesAndPermissionsSeeder.php).
* **Execution**: Registered it inside [DatabaseSeeder.php](file:///C:/laragon/www/WHMS/database/seeders/DatabaseSeeder.php) and executed `php artisan tenants:seed --tenants=whms`.
* **Configured Roles**:
  * `Super Admin`: Granted all system permissions.
  * `Warehouse Keeper`: Granted inventory and stock operation permissions.
  * `Accountant`: Granted contracts, billing, and accounting permissions.
  * `Worker`: Granted read-only/view permissions.
* **Auto Owner Assignment**: User `ID = 1` is automatically assigned the `Super Admin` role upon seeding.

### 3. Model & Controller Wiring
* **Model Trait**: Added Spatie's `HasRoles` trait to [User.php](file:///C:/laragon/www/WHMS/app/Models/User.php).
* **Permissions Retrieval**: Updated the `getPermissions()` method to return Spatie permissions for regular staff while maintaining a hardcoded override safety check for managers (ID 1 / specific job titles).
* **Permissions Modification**: Replaced the controller's custom JSON array storage with the Spatie sync API inside [EmployeeController.php](file:///C:/laragon/www/WHMS/app/Http/Controllers/Tenant/EmployeeController.php):
  ```php
  $employee->syncPermissions($validated['permissions']);
  ```

---

## ⚙️ Manual Verification for Deployments

Whenever you publish this release to production:
1. **Upload & Extract**: Extract `WHMS_release.zip`.
2. **Migrate Tenant DBs**: Execute the tenant migration command on the server to build Spatie's tables:
   ```bash
   php artisan tenants:migrate
   ```
3. **Seed Roles & Permissions**: Seed the permissions and assign the initial owner:
   ```bash
   php artisan tenants:seed
   ```
4. **Clear Caches**: Visit `https://whms.ag-stores.com/clear.php` to clear configuration and routes caches.
