# Proyek Tugas Akhir - Platform Kriptografi Agensi 🕵️‍♂️

Ini adalah aplikasi web *full-stack* dengan tema "Agen Rahasia", yang mengimplementasikan kriptografi hibrida (simetris + asimetris) untuk komunikasi aman dan penyimpanan data terenkripsi.

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
4.  **Git:** (Sudah ada di Laragon)

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
    Perintah ini akan membuat semua tabel (`users`, `admin_keys`, `encrypted_messages`, `secure_files`, `personal_access_tokens`) dan membuat 1 admin *default*.
    ```bash
    php artisan migrate:fresh --seed
    ```
10. **Buat Kunci RSA (SANGAT PENTING):**
    Ini adalah inti dari sistem keamanan hibrida kita.
    ```bash
    php artisan app:generate-rsa-keys
    ```
    * Tekan **"yes"** untuk menyimpan Kunci Publik 🔓 ke *database*.
    * **SIMPAN KUNCI PRIVAT:** Salin (copy) **seluruh** `-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----` ke *file* `.txt` yang aman. Ini adalah kunci utama Admin.

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
* **Login Agen:** Perbandingan *Hash* **SHA-512** (tanpa *salt*). Agen memasukkan *password* asli, *backend* men-*hash*-nya dan membandingkan.
* **Database Agen:** *Password* Agen disimpan sebagai *hash* **SHA-512** dan *plaintext* (untuk demo "Data Deskripsi").

### 2. Kanal Laporan Rahasia (Scytale + AES + RSA)
* **Algoritma Super Enkripsi (Hibrida):**
    1.  Pesan dienkripsi dengan **Scytale** (Klasik).
    2.  Hasilnya dienkripsi lagi dengan **kunci AES acak**.
    3.  Kunci AES acak itu dienkripsi dengan **Kunci Publik RSA Admin**.
* **Admin Dekripsi:** Admin menggunakan **Kunci Privat RSA** 🔑 miliknya untuk mendekripsi kunci AES, yang kemudian digunakan untuk mendekripsi pesan Scytale.
* **Fitur:** Mendukung "Pesan Meledak" (Hancur setelah dibaca).

### 3. Database Target (Camellia + LSB)
* **Algoritma Steganografi (Simetris):**
    1.  Teks "Data Intel" dienkripsi dulu menggunakan **Camellia-256-CBC**.
    2.  *Ciphertext* (hasil Camellia) disembunyikan ke dalam gambar (`.png`, `.gif`, dll) menggunakan **LSB (Least Significant Bit)**.
* **Kunci:** Agen dan Admin harus menggunakan "Kunci Enkripsi (Camellia)" yang sama (dibagikan di luar sistem) untuk fitur ini.

### 4. Secure Vault (Camellia + RSA)
* **Algoritma File (Hibrida):**
    1.  Seluruh isi *file* (PDF, ZIP, dll) dienkripsi dengan **kunci Camellia acak**.
    2.  Kunci Camellia acak itu dienkripsi dengan **Kunci Publik RSA Admin**.
* **Admin Dekripsi:** Admin menggunakan **Kunci Privat RSA** 🔑 miliknya untuk mendekripsi kunci Camellia, yang kemudian digunakan untuk mendekripsi *file*.

---

## ⚠️ Troubleshooting (Perbaikan Error Umum)

#### Error: `GD Library extension not available` (Saat Steganografi / Database Target)
Ini berarti PHP kamu belum mengaktifkan modul gambar.
1.  Klik kanan di jendela **Laragon** -> **PHP** -> **Extensions**.
2.  Cari `gd` di daftar itu dan **klik** untuk memberinya tanda **centang (✓)**.
3.  Hentikan dan jalankan lagi `php artisan serve`.

#### Error: "Gagal terhubung ke server" (Saat Tambah User / Kirim Pesan)
Ini 99% adalah *error cache* di Laravel.
1.  Hentikan server `php artisan serve` (`Ctrl` + `C`).
2.  Jalankan 2 perintah ini di terminal *backend*:
    ```bash
    php artisan config:clear
    php artisan cache:clear
    ```
3.  Jalankan lagi `php artisan serve`.