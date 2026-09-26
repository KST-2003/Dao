<?php

namespace App\Console\Commands;

use App\Models\AdminRole;
use App\Models\AdminUser;
use Illuminate\Console\Command;

class CreateAdmin extends Command
{
    protected $signature = 'dao:admin:create {email} {--name=Admin} {--role=super_admin}';

    protected $description = 'Create an admin user (password is prompted, never passed on the command line)';

    public function handle(): int
    {
        $role = AdminRole::query()->where('slug', $this->option('role'))->first();
        if (! $role) {
            $this->error('Unknown role. Run the seeders first.');

            return self::FAILURE;
        }
        $password = (string) $this->secret('Password (min 12 chars)');
        if (strlen($password) < 12) {
            $this->error('Password must be at least 12 characters.');

            return self::FAILURE;
        }
        AdminUser::query()->updateOrCreate(
            ['email' => strtolower($this->argument('email'))],
            ['name' => $this->option('name'), 'password' => $password, 'admin_role_id' => $role->id, 'is_active' => true],
        );
        $this->info('Admin saved.');

        return self::SUCCESS;
    }
}
