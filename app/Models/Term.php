<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Term extends Model {
    protected $fillable = ['text_ar', 'text_en', 'is_active', 'has_variables', 'sort_order'];

    protected $casts = [
        'is_active'     => 'boolean',
        'has_variables' => 'boolean',
        'sort_order'    => 'integer',
    ];

    public function contracts()
    {
        return $this->belongsToMany(Contract::class, 'contract_terms')
                    ->withPivot('sort_order')
                    ->orderByPivot('sort_order');
    }

    public function seasons()
    {
        return $this->belongsToMany(Season::class, 'season_terms')
                    ->withPivot('sort_order')
                    ->orderByPivot('sort_order');
    }

    /**
     * Replace variables in term text with actual contract values.
     * Supported: {$mandatory_period}, {$renew_period}
     */
    public function resolveText(string $lang = 'ar', array $vars = []): string
    {
        $text = $lang === 'ar' ? $this->text_ar : ($this->text_en ?? $this->text_ar);
        foreach ($vars as $key => $value) {
            $text = str_replace('{$' . $key . '}', $value, $text);
        }
        return $text;
    }
}
