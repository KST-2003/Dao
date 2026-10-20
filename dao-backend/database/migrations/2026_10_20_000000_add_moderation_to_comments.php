<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Comment v2: image, likes, one-level replies, admin ban (the author still sees it) and soft delete. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->string('status', 10)->default('visible')->after('body')->index();
            $table->string('image_url')->nullable()->after('body');
            $table->unsignedInteger('like_count')->default(0);
            $table->unsignedInteger('reply_count')->default(0);
            $table->foreignId('reply_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('banned_reason')->nullable();
            $table->foreignId('moderated_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->softDeletes();
        });

        DB::table('comments')->where('is_hidden', true)->update(['status' => 'banned']);

        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('is_hidden');
            $table->text('body')->nullable()->change(); // an image-only comment has no text
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->boolean('is_hidden')->default(false);
        });
        DB::table('comments')->where('status', 'banned')->update(['is_hidden' => true]);
        Schema::table('comments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('moderated_by');
            $table->dropConstrainedForeignId('reply_to_user_id');
            $table->dropColumn(['status', 'image_url', 'like_count', 'reply_count', 'banned_reason', 'moderated_at', 'deleted_at']);
        });
    }
};
