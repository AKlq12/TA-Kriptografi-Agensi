<?php
namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User; // <-- Pastikan ini ditambahkan

class AdminSeeder extends Seeder
{
    /**
     * Jalankan database seeds.
     */
    public function run(): void
    {
        User::create([
            'username_admin' => 'admin',
            'password_plaintext' => '123', // Password admin default
            'role' => 'admin'
        ]);
    }
}