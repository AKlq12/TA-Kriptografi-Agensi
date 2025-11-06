<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EncryptedMessage extends Model
{
    use HasFactory;

    // Izinkan kolom ini untuk diisi
    protected $fillable = [
    'user_id',
    'ciphertext',
    'scytale_key',
    'read_once',
    'encrypted_session_key', // <-- TAMBAHKAN INI
    ];

    // Buat relasi agar kita bisa tahu siapa pengirimnya
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}