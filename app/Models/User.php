<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, \App\Traits\LogsActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'is_admin',
        'password',
        'username',
        'phone',
        'id_number',
        'job_title',
        'avatar',
        'setup_token',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'preferences' => 'array',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Check if user wants to receive specific notification type
     */
    public function wantsNotification(string $type): bool
    {
        $prefs = $this->preferences['notifications'] ?? [];
        return !isset($prefs[$type]) || (bool) $prefs[$type];
    }

    /**
     * Get the active permissions for the user.
     *
     * @return array<string>
     */
    public function getPermissions(): array
    {
        // 1. المسؤولين لديهم كافة الصلاحيات تلقائياً
        $isManager = (bool) $this->is_admin;

        if ($isManager) {
            return [
                'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.activate',
                'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
                'pallets.view', 'pallets.create', 'pallets.edit', 'pallets.delete',
                'inventory-items.view', 'inventory-items.create', 'inventory-items.edit', 'inventory-items.delete',
                'receptions.view', 'receptions.create', 'receptions.edit', 'receptions.delete', 'receptions.approve',
                'exit_authorizations.view', 'exit_authorizations.create', 'exit_authorizations.edit', 'exit_authorizations.delete', 'exit_authorizations.approve',
                'deliveries.view', 'deliveries.create', 'deliveries.edit', 'deliveries.delete', 'deliveries.approve',
                'accounting.view', 'accounting.create', 'accounting.edit', 'accounting.delete', 'accounting.approve',
                'settings.view', 'settings.edit',
                'employees.view', 'employees.create', 'employees.edit', 'employees.delete'
            ];
        }

        // 2. الموظفون العاديون نقوم بجلب صلاحياتهم من الحزمة القياسية Spatie
        try {
            return $this->getAllPermissions()->pluck('name')->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }
}
