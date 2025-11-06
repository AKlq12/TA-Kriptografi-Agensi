<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username_agen')->unique()->nullable(); // Untuk User Agen
            $table->string('kode_agen')->unique()->nullable(); // Untuk User Agen
            
            // PERINGATAN (Untuk Laporan Anda): Menyimpan password plaintext TIDAK AMAN.
            // Ini dilakukan hanya untuk memenuhi permintaan "Lihat Data Deskripsi".
            $table->string('password_plaintext')->nullable(); 
            
            $table->string('password_hash', 128)->nullable(); // Hash SHA-512 (128 karakter)
            
            // Kolom untuk Admin
            $table->string('username_admin')->unique()->nullable(); // Untuk Admin
            
            // Role
            $table->enum('role', ['admin', 'agen'])->default('agen');
            
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Balikkan migrasi.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};