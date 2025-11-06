<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SteganografiService;
// Kita akan menggunakan OpenSSL untuk Camellia

class SteganografiController extends Controller
{
    protected $stego;
    // Tentukan cipher Camellia yang akan kita gunakan
    // 'camellia-256-cbc' adalah yang terkuat
    private $cipher = "camellia-256-cbc";

    public function __construct(SteganografiService $stego) 
    { 
        $this->stego = $stego; 
    }

    public function encode(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:png,jpg,jpeg,gif',
            'text' => 'required|string',
            'key' => 'required|string|min:6', // Ini akan jadi password
        ]);

        try {
            // --- LANGKAH 1: ENKRIPSI PESAN (MENGGUNAKAN Camellia) ---
            $encryptedText = $this->camellia_encrypt($request->text, $request->key);

            // --- LANGKAH 2: SEMBUNYIKAN (STEGANOGRAFI LSB) ---
            $image = $this->stego->encode($request->file('image'), $encryptedText);
            
            // Kembalikan gambar (disarankan PNG)
            return $image->response('png');

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal encode: ' . $e->getMessage()], 400);
        }
    }

    public function decode(Request $request)
    {
        $request->validate([ 
            'image' => 'required|image|mimes:png,jpg,jpeg,gif',
            'key' => 'required|string|min:6',
        ]);

        try {
            // --- LANGKAH 1: EKSTRAK PESAN (STEGANOGRAFI LSB) ---
            $encryptedText = $this->stego->decode($request->file('image'));

            // --- LANGKAH 2: DEKRIPSI PESAN (MENGGUNAKAN Camellia) ---
            $decryptedText = $this->camellia_decrypt($encryptedText, $request->key);

            // Cek apakah dekripsi gagal (misal: kunci salah)
            if ($decryptedText === false) {
                throw new \Exception("Kunci salah atau data korup.");
            }

            return response()->json(['secret_message' => $decryptedText]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mendekode: ' . $e->getMessage()], 400);
        }
    }

    // --- FUNGSI HELPER UNTUK CAMELLIA-256-CBC ---

    /**
     * Membuat kunci 32-byte (256-bit) yang aman dari password apa pun.
     */
    private function getKey($password) {
        // Gunakan SHA-256 untuk mengubah password (panjang bebas)
        // menjadi kunci 32-byte (256-bit) yang dibutuhkan Camellia-256
        return hash('sha256', $password, true); // 'true' = output biner
    }

    /**
     * Enkripsi teks menggunakan Camellia-256-CBC
     */
    private function camellia_encrypt($plaintext, $password) {
        $key = $this->getKey($password);

        // Dapatkan panjang IV (Initialization Vector) yang dibutuhkan
        $iv_length = openssl_cipher_iv_length($this->cipher); // Camellia menggunakan 16 bytes
        
        // Buat IV acak yang aman secara kriptografis
        $iv = openssl_random_pseudo_bytes($iv_length);
        
        // Enkripsi data
        $ciphertext = openssl_encrypt($plaintext, $this->cipher, $key, OPENSSL_RAW_DATA, $iv);
        
        // GABUNGKAN IV dengan ciphertext.
        // IV wajib disimpan agar bisa dipakai untuk dekripsi
        $iv_and_ciphertext = $iv . $ciphertext;
        
        // Base64 encode agar aman dikirim dan disembunyikan oleh LSB
        return base64_encode($iv_and_ciphertext);
    }

    /**
     * Dekripsi teks Camellia-256-CBC
     */
    private function camellia_decrypt($ciphertext_base64, $password) {
        $key = $this->getKey($password);

        // 1. Kembalikan dari Base64
        $iv_and_ciphertext = base64_decode($ciphertext_base64);
        if ($iv_and_ciphertext === false) {
            return false; // Gagal decode base64
        }

        // 2. Dapatkan panjang IV
        $iv_length = openssl_cipher_iv_length($this->cipher); // 16 bytes
        
        // 3. Ekstrak IV dari bagian depan
        $iv = substr($iv_and_ciphertext, 0, $iv_length);
        
        // 4. Ekstrak ciphertext murni dari sisanya
        $ciphertext = substr($iv_and_ciphertext, $iv_length);

        // 5. Dekripsi data
        $decrypted_text = openssl_decrypt($ciphertext, $this->cipher, $key, OPENSSL_RAW_DATA, $iv);
        
        return $decrypted_text; // Akan return 'false' jika kunci salah
    }
}