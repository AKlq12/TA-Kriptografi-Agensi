# Proyek Tugas Akhir - Platform Kriptografi Agensi

Ini adalah aplikasi web *full-stack* dengan tema "Agen Rahasia", yang mengimplementasikan berbagai algoritma kriptografi untuk komunikasi aman dan penyimpanan data.

-   **Backend:** Laravel 12 (`/cryptoweb-backend`)
-   **Frontend:** Next.js & Tailwind v3 (`/cryptoweb-frontend`)
-   **Tema:** "Hitman / Agen Rahasia" (UI Gelap, Aksen Merah/Biru, Font Mono)

---

## 💻 Kebutuhan Sistem

Pastikan laptop baru memiliki *software* berikut:

1.  **Laragon:** (Sangat Direkomendasikan) Ini sudah mencakup:
    * PHP (versi 8.2 atau lebih baru)
    * Server Database (MySQL / MariaDB)
    * Composer (untuk PHP)
    * *Catatan: Pastikan Laragon kamu sudah mengaktifkan ekstensi PHP `gd`.*
2.  **Node.js:** (Versi 18 atau lebih baru)
3.  **VS Code:** (Editor Kode)

---

## ⚙️ Instalasi Backend (Laravel)

Bagian ini untuk menyiapkan *server* API.

1.  **Start Laragon:** Buka Laragon dan klik **`Start All`**.
2.  **Buka Terminal 1 (Laragon):** Klik tombol **`Terminal`** di Laragon.
3.  **Masuk ke Folder Backend:**
    ```bash
    # (Asumsi proyekmu ada di C:\laragon\www\TA_kripto)
    cd TA_kripto\cryptoweb-backend
    ```
4.  **Install Dependensi PHP:**
    ```bash
    composer install
    ```
5.  **Salin File Konfigurasi:**
    ```bash
    copy .env.example .env
    ```
6.  **Buat Kunci Aplikasi:**
    ```bash
    php artisan key:generate
    ```
7.  **Buat Database:**
    Buka `http://localhost/phpmyadmin` dan buat *database* **kosong** baru bernama `kriptografi_ta`.
8.  **Atur File `.env`:**
    Buka *file* `.env` di VS Code dan pastikan 4 hal ini sudah benar:
    ```env
    # 1. Pastikan ini 'mysql'
    DB_CONNECTION=mysql
    DB_DATABASE=kriptografi_ta
    DB_USERNAME=root
    DB_PASSWORD=

    # 2. Ubah ini (sekitar baris 27)
    SESSION_DRIVER=file

    # 3. Ubah ini (sekitar baris 31)
    QUEUE_CONNECTION=sync
    
    # 4. Ubah ini (sekitar baris 33)
    CACHE_STORE=file
    ```
9.  **Migrasi & Seeding Database (PENTING):**
    Perintah ini akan membuat semua tabel (`users`, `personal_access_tokens`, `encrypted_messages`, `secure_files`) dan membuat 1 admin *default*.
    ```bash
    php artisan migrate:fresh --seed
    ```

---

## 🖥️ Instalasi Frontend (Next.js)

Bagian ini untuk menyiapkan Tampilan (UI).

1.  **Buka Terminal 2 (Laragon):** Buka jendela *Terminal* Laragon baru.
2.  **Masuk ke Folder Frontend:**
    ```bash
    cd TA_kripto\cryptoweb-frontend
    ```
3.  **Install Dependensi Node.js:**
    ```bash
    npm install
    ```
4.  **Downgrade & Install Tailwind v3 (Wajib):**
    Proyek ini dirancang untuk v3 yang stabil.
    ```bash
    npm install -D tailwindcss@3.4.14 postcss autoprefixer
    ```
5.  **Buat File Konfigurasi Tailwind (Wajib):**
    ```bash
    npx tailwindcss init -p
    ```
6.  **Edit `tailwind.config.js`:**
    Buka `tailwind.config.js` (yang baru dibuat) dan **GANTI ISINYA** dengan ini:
    ```javascript
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}", // <-- INI PENTING
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }
    ```

---

## 🚀 Menjalankan Aplikasi

Kamu perlu menjalankan **kedua server** secara bersamaan.

1.  **Jalankan Backend (di Terminal 1):**
    ```bash
    php artisan serve
    ```
    *(Server akan berjalan di `http://127.0.0.1:8000`)*

2.  **Jalankan Frontend (di Terminal 2):**
    ```bash
    npm run dev
    ```
    *(Server akan berjalan di `http://localhost:3000`)*

3.  Buka browser kamu dan akses: **`http://localhost:3000`**

---

## 🔑 Fitur & Algoritma yang Digunakan

### 1. Autentikasi
* **Login Admin:** Perbandingan *Plaintext* (`admin`/`123`).
* **Login Agen:** Perbandingan *Hash* **SHA-512**.
* **Database:** *Password* Agen disimpan sebagai *hash* **SHA-512** (128 karakter) dan *plaintext* (untuk demo "Data Deskripsi").

### 2. Kanal Laporan Rahasia (Scytale + AES)
* Agen bisa mengirim pesan teks rahasia ke Admin.
* **Algoritma Super Enkripsi:** **Scytale Cipher** (Klasik) lalu dienkripsi lagi dengan **AES-256-CBC** (Modern).
* **Kunci:** Menggunakan 2 kunci terpisah: Kunci Scytale (angka) dan Kunci Sesi AES (teks rahasia).
* **Fitur Pesan Meledak (Self-Destruct):** Agen bisa mencentang "Hancurkan Setelah Dibaca". Setelah Admin mendekripsi pesan ini, pesan akan otomatis terhapus dari *database*.

### 3. Database Target (Camellia + LSB)
* Agen bisa menyembunyikan data intel (teks) ke dalam foto target (gambar).
* **Algoritma File (Enkripsi):** Teks intel dienkripsi dulu menggunakan **Camellia-256-CBC**.
* **Algoritma Steganografi (Metode):** *Ciphertext* hasil Camellia disembunyikan ke dalam gambar menggunakan **LSB (Least Significant Bit) Insertion**.
* **Objek (Carrier):** Mendukung file `.png`, `.jpg`, `.jpeg`, dan `.gif`. (Disarankan `.png`).

### 4. Secure Vault (Camellia File Encryption)
* Agen bisa meng-*upload* berkas rahasia (seperti `.pdf`, `.zip`, `.txt`) ke *database* aman.
* **Algoritma File (Enkripsi):** Seluruh isi *file* dienkripsi menggunakan **Camellia-256-CBC**.
* **Penyimpanan:** *File* terenkripsi disimpan di *server* (`storage/app/vault/`).
* **Akses:** Admin bisa men-*download* dan mendekripsi *file* tersebut menggunakan kunci yang benar.

---

## ⚠️ Troubleshooting (Perbaikan Error Umum)

#### Error: `GD Library extension not available` (Saat Steganografi / Database Target)
Ini berarti PHP kamu belum mengaktifkan modul gambar.

1.  Buka **Laragon**.
2.  Klik kanan di jendela Laragon -> **PHP** -> **Extensions**.
3.  Cari `gd` di daftar itu dan **klik** untuk memberinya tanda **centang (✓)**.
4.  Laragon akan otomatis me-restart Apache.
5.  Hentikan dan jalankan lagi `php artisan serve`.

#### Error: "Gagal terhubung ke server" (Saat Tambah User / Kirim Pesan)
Ini 99% adalah *error cache* di Laravel.

1.  Hentikan server `php artisan serve` (`Ctrl` + `C`).
2.  Jalankan 2 perintah ini di terminal *backend*:
    ```bash
    php artisan config:clear
    php artisan cache:clear
    ```
3.  Jalankan lagi `php artisan serve`.