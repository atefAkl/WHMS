<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pallet extends Model
{
    protected $fillable = [
        'pallet_number',
        'pallet_code',
        'size',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($pallet) {
            $sizeCodes = [
                'كبيرة' => '01',
                'وسط' => '02',
                'صغيرة' => '03',
                'خشب' => '04',
                'بلاستيك' => '05',
            ];
            $code = $sizeCodes[$pallet->size] ?? '02';
            $num = str_pad((string)$pallet->pallet_number, 5, '0', STR_PAD_LEFT);
            $pallet->pallet_code = 'PAL' . $code . $num;
        });
    }

    public static function findOrCreateFromCode(string $code)
    {
        $code = trim($code);
        if (empty($code)) {
            return null;
        }

        // 1. Try to find the pallet by code directly
        $pallet = self::where('pallet_code', $code)->first();
        if ($pallet) {
            return $pallet;
        }

        // 2. Try to find by number if code is just numeric
        $cleanNumber = preg_replace('/[^0-9]/', '', $code);
        if ($cleanNumber !== '') {
            $palletByNum = self::where('pallet_number', (string)(int)$cleanNumber)->first();
            if ($palletByNum) {
                return $palletByNum;
            }
        }

        // 3. Parse code pattern PAL[size_code][number]
        if (preg_match('/^PAL(0[1-5])(\d+)$/i', $code, $matches)) {
            $sizeCode = $matches[1];
            $numberVal = (int)$matches[2];
            
            $sizeMap = [
                '01' => 'كبيرة',
                '02' => 'وسط',
                '03' => 'صغيرة',
                '04' => 'خشب',
                '05' => 'بلاستيك',
            ];
            $size = $sizeMap[$sizeCode] ?? 'وسط';
            $numString = (string)$numberVal;

            // Before creating, check if this code already exists
            $palletByGeneratedCode = self::where('pallet_code', $code)->first();
            if ($palletByGeneratedCode) {
                return $palletByGeneratedCode;
            }

            return self::create([
                'pallet_number' => $numString,
                'pallet_code' => $code,
                'size' => $size,
            ]);
        }

        // 4. Fallback for other formats (like "15" or "PAL-XYZ")
        $number = $cleanNumber !== '' ? (string)(int)$cleanNumber : $code;
        
        // Determine size based on the number if numeric
        $size = 'وسط';
        if (is_numeric($number)) {
            $numVal = (int)$number;
            if ($numVal < 3000) {
                $size = 'صغيرة';
            } elseif ($numVal >= 3001 && $numVal < 13000) {
                $size = 'كبيرة';
            } elseif ($numVal >= 13001 && $numVal < 15000) {
                $size = 'خشب';
            } elseif ($numVal >= 15001 && $numVal < 20000) {
                $size = 'بلاستيك';
            }
        }

        // Calculate expected code to see if it already exists
        $sizeCodes = [
            'كبيرة' => '01',
            'وسط' => '02',
            'صغيرة' => '03',
            'خشب' => '04',
            'بلاستيك' => '05',
        ];
        $codePart = $sizeCodes[$size] ?? '02';
        $numPart = str_pad($number, 5, '0', STR_PAD_LEFT);
        $expectedCode = 'PAL' . $codePart . $numPart;

        $existingPallet = self::where('pallet_code', $expectedCode)
            ->orWhere('pallet_number', $number)
            ->first();
            
        if ($existingPallet) {
            return $existingPallet;
        }

        return self::create([
            'pallet_number' => $number,
            'size' => $size,
        ]);
    }

    public function movements()
    {
        return $this->hasMany(Movement::class);
    }

    public function inventoryEntries()
    {
        return $this->hasMany(InventoryEntry::class);
    }
}
