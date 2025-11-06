<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_keys', function (Blueprint $table) {
            $table->id();
            $table->text('public_key'); // Tempat menyimpan Kunci Publik RSA
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('admin_keys');
    }
};