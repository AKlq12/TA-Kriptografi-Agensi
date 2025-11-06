<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ScytaleService;
use App\Models\EncryptedMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // <-- Import DB

class UserAgenController extends Controller
{
    protected $scytale;
    private $aes_cipher = "AES-256-CBC";

    public function __construct(ScytaleService $scytale)
    {
        $this->scytale = $scytale;
    }

    // --- FUNGSI AGEN: Kirim Pesan ---
    public function sendMessage(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
            'scytale_key' => 'required|integer|min:2|max:100',
            // 'aes_key' HILANG (karena di-generate)
            'read_once' => 'required|boolean',
        ]);

        try {
            // Ambil Kunci Publik Admin dari DB
            $adminKey = DB::table('admin_keys')->first();
            if (!$adminKey) {
                throw new \Exception("Admin belum mengatur Kunci Publik.");
            }
            $adminPublicKey = $adminKey->public_key;

            // 1. Buat Kunci Sesi AES ACAK (256-bit)
            $session_aes_key = openssl_random_pseudo_bytes(32); 

            // 2. Enkripsi Scytale
            $scytale_ciphertext = $this->scytale->encrypt($request->text, (int)$request->scytale_key);

            // 3. Enkripsi AES (menggunakan kunci acak)
            $final_ciphertext = $this->aes_encrypt($scytale_ciphertext, $session_aes_key);

            // 4. Enkripsi Kunci Sesi AES (menggunakan Kunci Publik RSA)
            openssl_public_encrypt($session_aes_key, $encrypted_aes_key, $adminPublicKey, OPENSSL_PKCS1_OAEP_PADDING);

            // 5. Simpan ke Database
            EncryptedMessage::create([
                'user_id' => Auth::id(),
                'ciphertext' => $final_ciphertext,
                'scytale_key' => (int)$request->scytale_key,
                'read_once' => $request->read_once,
                'encrypted_session_key' => base64_encode($encrypted_aes_key), // Simpan kunci yg dienkrip RSA
            ]);

            return response()->json(['message' => 'Laporan terenkripsi berhasil dikirim.']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mengirim pesan: ' . $e->getMessage()], 400);
        }
    }

    // --- FUNGSI ADMIN: Ambil Daftar Pesan ---
    public function getMessages()
    {
        $messages = EncryptedMessage::with('user:id,username_agen')
                        ->orderBy('created_at', 'desc')
                        ->get();
        return response()->json($messages);
    }

    // --- FUNGSI ADMIN: Dekripsi Pesan (Hibrida) ---
    public function decryptMessage(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:encrypted_messages,id',
            'admin_private_key' => 'required|string', // <-- Menerima Kunci Privat
        ]);

        try {
            $message = EncryptedMessage::findOrFail($request->id);

            // 1. Dekripsi Kunci Sesi (menggunakan Kunci Privat RSA)
            $encrypted_aes_key = base64_decode($message->encrypted_session_key);
            openssl_private_decrypt($encrypted_aes_key, $decrypted_aes_key, $request->admin_private_key, OPENSSL_PKCS1_OAEP_PADDING);

            if ($decrypted_aes_key === null) {
                throw new \Exception("Kunci Privat salah atau data korup.");
            }

            // 2. Dekripsi Tahap 1 (AES - menggunakan kunci sesi yg barusan didekrip)
            $scytale_ciphertext = $this->aes_decrypt($message->ciphertext, $decrypted_aes_key);
            if ($scytale_ciphertext === false) {
                throw new \Exception("Kunci Sesi AES salah atau data korup.");
            }

            // 3. Dekripsi Tahap 2 (Scytale)
            $plaintext = $this->scytale->decrypt($scytale_ciphertext, (int)$message->scytale_key);

            // 4. Hancurkan Pesan
            if ($message->read_once) {
                $message->delete();
            }

            return response()->json(['plaintext' => $plaintext]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Dekripsi gagal: ' . $e->getMessage()], 400);
        }
    }


    // --- FUNGSI HELPER AES (Kunci sebagai parameter, bukan password) ---
    private function aes_encrypt($plaintext, $key) { // <-- $key adalah biner
        $iv_length = openssl_cipher_iv_length($this->aes_cipher);
        $iv = openssl_random_pseudo_bytes($iv_length);
        $ciphertext = openssl_encrypt($plaintext, $this->aes_cipher, $key, OPENSSL_RAW_DATA, $iv);
        $iv_and_ciphertext = $iv . $ciphertext;
        return base64_encode($iv_and_ciphertext);
    }

    private function aes_decrypt($ciphertext_base64, $key) { // <-- $key adalah biner
        $iv_and_ciphertext = base64_decode($ciphertext_base64);
        if ($iv_and_ciphertext === false) return false;
        $iv_length = openssl_cipher_iv_length($this->aes_cipher);
        $iv = substr($iv_and_ciphertext, 0, $iv_length);
        $ciphertext = substr($iv_and_ciphertext, $iv_length);
        return openssl_decrypt($ciphertext, $this->aes_cipher, $key, OPENSSL_RAW_DATA, $iv);
    }
}