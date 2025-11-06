<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecureFile extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'original_filename',
    'storage_path',
    'encrypted_session_key', // <-- TAMBAHKAN INI
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}