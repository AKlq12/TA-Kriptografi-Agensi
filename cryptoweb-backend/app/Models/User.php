<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <-- Ini sudah benar

class User extends Authenticatable
{
    // HANYA PERLU SATU BARIS 'use' INI
    use HasApiTokens, HasFactory, Notifiable; 

    /**
     * Atribut yang boleh diisi secara massal.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'username_agen',
        'kode_agen',
        'password_plaintext',
        'password_hash',
        'username_admin',
        'role',
    ];

    /**
     * Atribut yang harus disembunyikan saat serialisasi.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        //'password_plaintext', // Sembunyikan password asli
        'remember_token',
    ];

    /**
     * Atribut yang harus di-cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // Kita tidak punya 'email_verified_at'
            // 'password' kita tidak di-hash otomatis, jadi hapus saja
        ];
    }
}