<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    public static function bootLogsActivity()
    {
        static::created(function ($model) {
            $model->logCreatedActivity();
        });

        static::updated(function ($model) {
            $model->logUpdatedActivity();
        });

        static::deleted(function ($model) {
            $model->logDeletedActivity();
        });
    }

    protected function logCreatedActivity()
    {
        $newValues = $this->filterAttributes($this->getAttributes());
        $label = ActivityLog::resolveSubjectLabel($this);
        $modelName = $this->getModelArabicName();

        ActivityLog::log(
            "إضافة {$modelName} جديد ({$label})",
            'create',
            $this,
            null,
            $newValues,
            $label
        );
    }

    protected function logUpdatedActivity()
    {
        $dirty = $this->getDirty();
        $ignored = $this->getIgnoredLogAttributes();

        $oldValues = [];
        $newValues = [];

        foreach ($dirty as $key => $newValue) {
            if (in_array($key, $ignored)) {
                continue;
            }
            $oldValues[$key] = $this->getOriginal($key);
            $newValues[$key] = $newValue;
        }

        if (empty($newValues)) {
            return;
        }

        $label = ActivityLog::resolveSubjectLabel($this);
        $modelName = $this->getModelArabicName();

        ActivityLog::log(
            "تعديل {$modelName} ({$label})",
            'update',
            $this,
            $oldValues,
            $newValues,
            $label
        );
    }

    protected function logDeletedActivity()
    {
        $oldValues = $this->filterAttributes($this->getAttributes());
        $label = ActivityLog::resolveSubjectLabel($this);
        $modelName = $this->getModelArabicName();

        ActivityLog::log(
            "حذف {$modelName} ({$label})",
            'delete',
            $this,
            $oldValues,
            null,
            $label
        );
    }

    protected function filterAttributes(array $attributes): array
    {
        $ignored = $this->getIgnoredLogAttributes();
        return array_diff_key($attributes, array_flip($ignored));
    }

    protected function getIgnoredLogAttributes(): array
    {
        return array_merge([
            'password',
            'remember_token',
            'updated_at',
            'created_at',
            'secure_password',
        ], property_exists($this, 'dontLog') ? $this->dontLog : []);
    }

    protected function getModelArabicName(): string
    {
        if (property_exists($this, 'modelArabicName')) {
            return $this->modelArabicName;
        }

        $map = [
            'Reception' => 'سند استلام',
            'Delivery' => 'سند تسليم/خروج',
            'Contract' => 'عقد تخزين',
            'Pallet' => 'طبلية',
            'SalesInvoice' => 'فاتورة مبيعات',
            'FinancialVoucher' => 'سند مالـي',
            'ExitAuthorization' => 'تصريح خروج',
            'Customer' => 'عميل',
            'InventoryItem' => 'صنف مخزني',
            'StorageItem' => 'خدمة/صنف عقد',
            'User' => 'مستخدم',
            'Driver' => 'سائق',
            'QueueTicket' => 'تذكرة انتظار',
            'Service' => 'خدمة/صنف',
        ];

        $class = class_basename($this);
        return $map[$class] ?? $class;
    }
}
