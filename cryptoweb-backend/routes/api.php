<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserAgenController;
use App\Http\Controllers\SteganografiController;
use App\Http\Controllers\FileVaultController; // <-- TAMBAHKAN INI

// Rute Publik (Login)
Route::post('/login', [AuthController::class, 'login']);

// Rute Terproteksi (Butuh Login / Token)
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);

    // Grup Rute Admin
    Route::middleware('abilities:role:admin')->prefix('admin')->group(function () {
        Route::post('/tambah-user', [AdminController::class, 'tambahUser']);
        Route::get('/data-enkripsi', [AdminController::class, 'lihatDataEnkripsi']);
        Route::get('/data-deskripsi', [AdminController::class, 'lihatDataDeskripsi']);
        
        // Rute Laporan Rahasia
        Route::get('/get-messages', [UserAgenController::class, 'getMessages']);
        Route::post('/decrypt-message', [UserAgenController::class, 'decryptMessage']);

        // --- RUTE BARU: SECURE VAULT (ADMIN) ---
        Route::get('/vault/files', [FileVaultController::class, 'getFiles']);
        Route::post('/vault/download', [FileVaultController::class, 'downloadFile']);
    });

    // Grup Rute User Agen
    Route::middleware('abilities:role:agen')->prefix('agen')->group(function () {
        
        // Rute Laporan Rahasia
        Route::post('/send-message', [UserAgenController::class, 'sendMessage']);
        
        // Steganografi (Database Target)
        Route::post('/stego/encode', [SteganografiController::class, 'encode']);
        Route::post('/stego/decode', [SteganografiController::class, 'decode']);

        // --- RUTE BARU: SECURE VAULT (AGEN) ---
        Route::post('/vault/upload', [FileVaultController::class, 'uploadFile']);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});