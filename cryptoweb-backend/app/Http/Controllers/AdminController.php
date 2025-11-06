<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str; // Untuk generate Kode Agen

class AdminController extends Controller
{
    // Menu 1: Tambah User
    public function tambahUser(Request $request)
    {
        $request->validate([
            'username_agen' => 'required|string|unique:users,username_agen',
            'password' => 'required|string|min:4',
        ]);

        // 1. Buat Kode Agen (Contoh: AGEN-XXXXXX)
        $kode_agen = 'AGEN-' . strtoupper(Str::random(6));

        // 2. Hash password dengan SHA-256
        $password_hash = hash('sha512', $request->password);

        // 3. Simpan ke database
        $user = User::create([
            'username_agen' => $request->username_agen,
            'kode_agen' => $kode_agen,
            'password_plaintext' => $request->password, 
            'password_hash' => $password_hash,
            'role' => 'agen',
        ]);

        return response()->json([
            'message' => 'User Agen berhasil ditambahkan!',
            'user' => $user
        ], 201);
    }

    // Menu 2: Lihat Data Enkripsi User
    public function lihatDataEnkripsi()
    {
        $users = User::where('role', 'agen')->get(['kode_agen', 'password_hash']);
        return response()->json($users);
    }

    // Menu 3: Lihat Data Deskripsi User
    public function lihatDataDeskripsi()
    {
        $users = User::where('role', 'agen')->get(['username_agen', 'password_plaintext']);
        return response()->json($users);
    }
}