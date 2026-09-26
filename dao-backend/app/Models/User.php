<?php

namespace App\Models;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

/**
 * A DAO customer. Has no password: identity comes from linked auth providers (Google, LINE, SMS).
 *
 * @property int $id
 * @property string|null $name
 * @property string|null $display_name
 * @property string|null $email
 * @property string|null $phone
 * @property string $preferred_language
 * @property string $referral_code
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'display_name', 'email', 'phone', 'avatar_url', 'preferred_language',
        'country', 'date_of_birth', 'gender', 'referred_by_user_id', 'profile_completed', 'last_active_at',
    ];

    protected $hidden = ['remember_token'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'gender' => Gender::class,
            'profile_completed' => 'boolean',
            'last_active_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->referral_code)) {
                do {
                    $code = 'DAO'.Str::upper(Str::random(6));
                } while (static::withTrashed()->where('referral_code', $code)->exists());
                $user->referral_code = $code;
            }
        });
    }

    public function greetingName(): string
    {
        return $this->display_name ?: ($this->name ?: '');
    }

    public function authProviders(): HasMany
    {
        return $this->hasMany(UserAuthProvider::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function loyaltyAccount(): HasOne
    {
        return $this->hasOne(LoyaltyAccount::class);
    }

    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }

    public function membership(): HasOne
    {
        return $this->hasOne(UserMembership::class);
    }

    public function savedItems(): HasMany
    {
        return $this->hasMany(SavedItem::class);
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_user_id');
    }
}
