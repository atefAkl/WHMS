<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'action',
        'action_type',
        'subject_type',
        'subject_id',
        'subject_label',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Standard Log Activity Helper
     */
    public static function log(
        string $action,
        string $actionType = 'other',
        $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $customLabel = null
    ) {
        try {
            $user = Auth::user();

            $subjectType = null;
            $subjectId = null;
            $subjectLabel = $customLabel;

            if ($subject && is_object($subject)) {
                $subjectType = get_class($subject);
                $subjectId = $subject->getKey();

                if (!$subjectLabel) {
                    $subjectLabel = self::resolveSubjectLabel($subject);
                }
            } elseif (is_string($subject)) {
                $subjectLabel = $subject;
            }

            return self::create([
                'user_id'       => $user ? $user->id : null,
                'user_name'     => $user ? ($user->name ?? $user->username) : 'النظام (System)',
                'user_email'    => $user ? $user->email : null,
                'action'        => $action,
                'action_type'   => $actionType,
                'subject_type'  => $subjectType,
                'subject_id'    => $subjectId,
                'subject_label' => $subjectLabel,
                'old_values'    => $oldValues,
                'new_values'    => $newValues,
                'ip_address'    => Request::ip(),
                'user_agent'    => Request::userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Prevent logging failure from breaking core app operations
            \Illuminate\Support\Facades\Log::error('ActivityLog record failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Resolve a friendly label for model instances
     */
    public static function resolveSubjectLabel($model): string
    {
        if (isset($model->serial_number)) return (string) $model->serial_number;
        if (isset($model->contract_number)) return 'عقد رقم ' . $model->contract_number;
        if (isset($model->pallet_number)) return 'طبلية ' . $model->pallet_number;
        if (isset($model->pallet_code)) return 'طبلية ' . $model->pallet_code;
        if (isset($model->invoice_number)) return 'فاتورة ' . $model->invoice_number;
        if (isset($model->name)) return (string) $model->name;
        if (isset($model->title)) return (string) $model->title;
        if (isset($model->code)) return (string) $model->code;
        
        $classBasename = class_basename($model);
        return $classBasename . ' #' . $model->getKey();
    }
}
