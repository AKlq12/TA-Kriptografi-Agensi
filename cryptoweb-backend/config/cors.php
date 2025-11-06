<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS (Cross-Origin Resource Sharing) Configuration
    |--------------------------------------------------------------------------
    |
    | Di sinilah Anda dapat mengonfigurasi pengaturan untuk CORS.
    |
    */

    'paths' => ['api/*'], // <-- Pastikan ini menargetkan rute API Anda

    'allowed_methods' => ['*'], // Izinkan semua metode (GET, POST, PUT, DELETE)

    'allowed_origins' => [
        'http://localhost:3000', // <-- TAMBAHKAN ALAMAT FRONTEND ANDA DI SINI
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // Izinkan semua header (termasuk 'Authorization' untuk token)

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Izinkan pengiriman cookie/token

];