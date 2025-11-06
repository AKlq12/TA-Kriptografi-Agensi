<?php

namespace App\Http\Controllers; // <-- PASTIKAN "App", "Http", "Controllers" BENAR

use Illuminate\Http\Request;
use App\Models\SecureFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FileVaultController extends Controller
{
    private $cipher = "camellia-256-cbc";

    // Fungsi ini dipanggil Agen
    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Maks 10MB
            // 'key' HILANG (karena di-generate)
        ]);

        try {
            // Ambil Kunci Publik Admin dari DB
            $adminKey = DB::table('admin_keys')->first();
            if (!$adminKey) {
                throw new \Exception("Admin belum mengatur Kunci Publik.");
            }
            $adminPublicKey = $adminKey->public_key;

            $file = $request->file('file');
            $plaintext = file_get_contents($file->getRealPath());

            // 1. Buat Kunci Sesi Camellia ACAK (256-bit)
            $session_camellia_key = openssl_random_pseudo_bytes(32); // 32 bytes = 256 bits

            // 2. Enkripsi isi file (menggunakan kunci acak)
            $encryptedContents = $this->camellia_encrypt($plaintext, $session_camellia_key);
            if ($encryptedContents === false) {
                throw new \Exception("Gagal mengenkripsi file.");
            }

            // 3. Enkripsi Kunci Sesi Camellia (menggunakan Kunci Publik RSA)
            openssl_public_encrypt($session_camellia_key, $encrypted_camellia_key, $adminPublicKey, OPENSSL_PKCS1_OAEP_PADDING);

            // 4. Simpan file terenkripsi ke storage
            $storageName = 'vault/' . Str::uuid() . '.enc';
            Storage::put($storageName, $encryptedContents);

            // 5. Catat di database
            SecureFile::create([
                'user_id' => Auth::id(),
                'original_filename' => $file->getClientOriginalName(),
                'storage_path' => $storageName,
                'encrypted_session_key' => base64_encode($encrypted_camellia_key), // Simpan kunci yg dienkrip RSA
            ]);

            return response()->json(['message' => 'Berkas berhasil dienkripsi dan disimpan di Vault.'], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Upload gagal: ' . $e->getMessage()], 400);
        }
    }

    // Fungsi ini dipanggil Admin
    public function getFiles()
    {
        $files = SecureFile::with('user:id,username_agen')
                    ->orderBy('created_at', 'desc')
                    ->get();
        return response()->json($files);
    }

    // Fungsi ini dipanggil Admin
    public function downloadFile(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:secure_files,id',
            'admin_private_key' => 'required|string', // <-- Menerima Kunci Privat
        ]);

        try {
            $fileRecord = SecureFile::findOrFail($request->id);

            if (!Storage::exists($fileRecord->storage_path)) {
                throw new \Exception("File tidak ditemukan di storage.");
            }

            // 1. Dekripsi Kunci Sesi (menggunakan Kunci Privat RSA)
            $encrypted_camellia_key = base64_decode($fileRecord->encrypted_session_key);
            openssl_private_decrypt($encrypted_camellia_key, $decrypted_camellia_key, $request->admin_private_key, OPENSSL_PKCS1_OAEP_PADDING);
            
            if ($decrypted_camellia_key === null) {
                throw new \Exception("Kunci Privat salah atau file korup.");
            }

            // 2. Ambil & dekripsi isi file (menggunakan kunci sesi yg barusan didekrip)
            $encryptedContents = Storage::get($fileRecord->storage_path);
            $decryptedContents = $this->camellia_decrypt($encryptedContents, $decrypted_camellia_key);

            if ($decryptedContents === false) {
                throw new \Exception("Kunci Sesi Camellia salah atau file korup.");
            }

            // Kirim file yang sudah didekripsi ke user
            return response()->streamDownload(function () use ($decryptedContents) {
                echo $decryptedContents;
            }, $fileRecord->original_filename);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Download gagal: ' . $e->getMessage()], 400);
        }
    }

    // --- FUNGSI HELPER CAMELLIA (Kunci sebagai parameter, bukan password) ---
    private function camellia_encrypt($plaintext, $key) { // <-- $key adalah biner
        $iv_length = openssl_cipher_iv_length($this->cipher);
        $iv = openssl_random_pseudo_bytes($iv_length);
        $ciphertext = openssl_encrypt($plaintext, $this->cipher, $key, OPENSSL_RAW_DATA, $iv);
        $iv_and_ciphertext = $iv . $ciphertext;
        return base64_encode($iv_and_ciphertext);
    }

    private function camellia_decrypt($ciphertext_base64, $key) { // <-- $key adalah biner
        $iv_and_ciphertext = base64_decode($ciphertext_base64);
        if ($iv_and_ciphertext === false) return false;
        $iv_length = openssl_cipher_iv_length($this->cipher);
        $iv = substr($iv_and_ciphertext, 0, $iv_length);
        $ciphertext = substr($iv_and_ciphertext, $iv_length);
        return openssl_decrypt($ciphertext, $this->cipher, $key, OPENSSL_RAW_DATA, $iv);
    }
}