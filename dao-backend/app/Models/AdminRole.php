<?php

namespace App\Models;

use App\Enums\AdminPermission;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminRole extends Model
{
    protected $fillable = ['slug', 'name', 'permissions'];

    protected function casts(): array
    {
        return ['permissions' => 'array'];
    }

    public function allows(AdminPermission|string $permission): bool
    {
        $value = $permission instanceof AdminPermission ? $permission->value : $permission;
        $granted = $this->permissions ?? [];

        return in_array(AdminPermission::All->value, $granted, true) || in_array($value, $granted, true);
    }

    public function users(): HasMany
    {
        return $this->hasMany(AdminUser::class);
    }
}
