<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash; // Kita tetap pakai Hash facade untuk perbandingan aman

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Coba Login sebagai Admin
        if ($request->role === 'admin') {
            // Sesuai permintaan: username 'admin' dan password '123'
            if ($request->username === 'admin' && $request->password === '123') {
                // Ambil user admin
                $user = User::where('username_admin', 'admin')->first();
                // Buat token 'role:admin'
                $token = $user->createToken('admin_token', ['role:admin'])->plainTextToken;
                return response()->json(['message' => 'Login Admin Berhasil!', 'token' => $token, 'role' => 'admin']);
            } else {
                return response()->json(['message' => 'Username atau Password Admin Salah'], 401);
            }
        }

        // 2. Coba Login sebagai User Agen (INI YANG DIUBAH)
        if ($request->role === 'agen') {
            
            // Validasi input baru: kita minta 'password', bukan 'password_hash'
            $request->validate([
                'kode_agen' => 'required|string',
                'password' => 'required|string', // <-- Menerima plaintext password
            ]);

            $user = User::where('kode_agen', $request->kode_agen)->first();

            if (!$user) {
                return response()->json(['message' => 'Kode Agen tidak ditemukan'], 404);
            }

            // --- INI PERUBAHAN UTAMA ---
            // 1. Hash password (plaintext) yang baru dikirim dari frontend
            $inputHash = hash('sha512', $request->password);

            // 2. Bandingkan hash baru itu dengan hash yang ada di database
            if ($inputHash === $user->password_hash) {
                // Jika cocok, login berhasil
                $token = $user->createToken('agen_token', ['role:agen'])->plainTextToken;
                return response()->json([
                    'message' => 'Login Agen Berhasil!', 
                    'token' => $token, 
                    'role' => 'agen'
                ]);
            } else {
                return response()->json(['message' => 'Password Salah'], 401); // Pesan error lebih jelas
            }
            // --- AKHIR PERUBAHAN ---
        }

        return response()->json(['message' => 'Role tidak valid'], 400);
    }
    
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }
        return response()->json(['message' => 'Logout berhasil'], 200);
    }
}