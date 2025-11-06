<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // HAPUS SEMUA KODE FACTORY DARI SINI

        // HANYA SISAKAN BARIS INI
        $this->call(AdminSeeder::class);
    }
}
