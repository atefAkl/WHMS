<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Term extends Model {
    protected $fillable = ['text_ar', 'text_en', 'is_active', 'has_variables', 'sort_order', 'season_id', 'contract_id', 'parent_id'];

    protected $casts = [
        'is_active'     => 'boolean',
        'has_variables' => 'boolean',
        'sort_order'    => 'integer',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    public function parent()
    {
        return $this->belongsTo(Term::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Term::class, 'parent_id');
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
