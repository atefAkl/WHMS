<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TenantRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'email',
        'phone',
        'requested_subdomain',
        'plan',
        'status',
        'admin_notes',
        'setup_token',
        'activation_link',
    ];
}
