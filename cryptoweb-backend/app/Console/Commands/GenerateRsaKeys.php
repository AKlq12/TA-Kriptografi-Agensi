<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateRsaKeys extends Command
{
    protected $signature = 'app:generate-rsa-keys';
    protected $description = 'Generate a new RSA key pair and save the public key to the database';

    public function handle()
    {
        $this->info("Menghasilkan pasangan kunci RSA 4096-bit...");

        // Konfigurasi untuk kunci
        $config = [
            "digest_alg" => "sha512",
            "private_key_bits" => 4096,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ];

        // Buat kunci
        $res = openssl_pkey_new($config);
        if (!$res) {
            $this->error("Gagal membuat kunci. Pastikan OpenSSL terinstal dan terkonfigurasi di PHP.");
            return 1;
        }

        // Ekstrak Kunci Privat
        openssl_pkey_export($res, $privateKeyPem);

        // Ekstrak Kunci Publik
        $details = openssl_pkey_get_details($res);
        $publicKeyPem = $details['key'];

        $this->warn("--- KUNCI PRIVAT ANDA (SIMPAN INI!) ---");
        $this->line("Simpan kunci ini di tempat yang SANGAT aman. Ini adalah kunci utama Admin.");
        $this->line($privateKeyPem);
        $this->warn("-----------------------------------------");

        $this->info("--- KUNCI PUBLIK (Akan disimpan ke DB) ---");
        $this->line($publicKeyPem);
        $this->info("-----------------------------------------");

        if ($this->confirm('Apakah Anda ingin menyimpan Kunci Publik ini ke database sekarang? (Ini akan menimpa kunci lama)')) {
            DB::table('admin_keys')->truncate(); // Hapus kunci lama
            DB::table('admin_keys')->insert([
                'public_key' => $publicKeyPem,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->info("Kunci Publik berhasil disimpan ke database.");
        } else {
            $this->info("Penyimpanan dibatalkan.");
        }

        return 0;
    }
}