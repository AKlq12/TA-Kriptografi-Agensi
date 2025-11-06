<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encrypted_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('ciphertext');
            $table->integer('scytale_key');
            $table->boolean('read_once')->default(false);
            $table->text('encrypted_session_key'); // <-- TAMBAHAN BARU (Kunci AES yg dienkripsi RSA)
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('encrypted_messages');
    }
};