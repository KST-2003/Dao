<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Customers, their login providers, OTP challenges, addresses, devices. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('display_name')->nullable();
            $table->string('email')->nullable()->unique();
            $table->string('phone', 20)->nullable()->unique()->comment('E.164, normalized');
            $table->string('avatar_url')->nullable();
            $table->string('preferred_language', 5)->default('th');
            $table->char('country', 2)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('referral_code', 16)->unique();
            $table->foreignId('referred_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('profile_completed')->default(false);
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // One user ⇄ many login methods. Identity is (provider, provider_user_id), never email/phone alone.
        Schema::create('user_auth_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 20);
            $table->string('provider_user_id');
            $table->string('email')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_user_id']);
            $table->unique(['user_id', 'provider']);
        });

        Schema::create('otp_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20);
            $table->string('code_hash', 64);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();
            $table->index(['phone', 'created_at']);
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 50)->nullable();
            $table->string('recipient_name');
            $table->string('phone', 20);
            $table->char('country_code', 2);           // TH / MM
            $table->string('region')->nullable();      // TH: province (จังหวัด) · MM: state/region
            $table->string('district')->nullable();    // TH: district (อำเภอ/เขต) · MM: district
            $table->string('subdistrict')->nullable(); // TH: sub-district (ตำบล/แขวง) · MM: township
            $table->string('city')->nullable();
            $table->string('postal_code', 12)->nullable();
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('notes', 500)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_default']);
        });

        Schema::create('device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token')->unique();
            $table->string('platform', 10);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('otp_challenges');
        Schema::dropIfExists('user_auth_providers');
        Schema::dropIfExists('users');
    }
};
