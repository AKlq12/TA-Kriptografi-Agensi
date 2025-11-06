<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secure_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('original_filename');
            $table->string('storage_path');
            $table->text('encrypted_session_key'); // <-- TAMBAHAN BARU (Kunci Camellia yg dienkripsi RSA)
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('secure_files');
    }
};