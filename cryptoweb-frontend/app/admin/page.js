// app/admin/page.js
'use client';
import { useState, useEffect } from 'react';

// --- (Komponen apiFetch & LogoutButton TETAP SAMA) ---
const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...options.headers,
    };
    const res = await fetch(`http://127.0.0.1:8000/api${url}`, { ...options, headers });
    if (res.status === 401) { 
        localStorage.clear();
        window.location.href = '/'; 
        return null;
    }
    return res;
};

function LogoutButton() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const handleLogout = async () => {
        setIsLoggingOut(true);
        await apiFetch('/logout', { method: 'POST' });
        localStorage.clear(); 
        window.location.href = '/'; 
    };
    return (
        <button onClick={handleLogout} disabled={isLoggingOut} className="py-2 px-5 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
            {isLoggingOut ? "..." : "Logout"}
        </button>
    );
}

function Notification({ message }) {
    if (!message.text) return null;
    const styles = {
        success: 'text-green-300 bg-green-900/50',
        error: 'text-yellow-300 bg-yellow-900/50',
        info: 'text-blue-300 bg-blue-900/50',
    };
    return (
        <p className={`mb-4 p-3 rounded-none border-l-4 ${styles[message.type]} ${message.type === 'success' ? 'border-green-500' : 'border-yellow-500'}`}>
            {message.text}
        </p>
    );
}
// --- Akhir Komponen ---


export default function AdminDashboard() {
    const [menu, setMenu] = useState('tambah');
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [usernameAgen, setUsernameAgen] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: 'info' });

    // --- PERUBAHAN 1: Hapus Kunci AES, tambahkan Kunci Privat ---
    const [messages, setMessages] = useState([]);
    const [adminPrivateKey, setAdminPrivateKey] = useState(''); // <-- Kunci Privat RSA
    const [decryptedMessage, setDecryptedMessage] = useState('');

    const [files, setFiles] = useState([]);
    // (Kunci fileKey tidak lagi dibutuhkan di sini)

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'admin') {
            localStorage.clear();
            window.location.href = '/';
        }
        // Muat Kunci Privat dari localStorage jika ada
        const savedKey = localStorage.getItem('adminPrivateKey');
        if (savedKey) {
            setAdminPrivateKey(savedKey);
        }
    }, []);

    // Simpan kunci privat ke local storage saat berubah
    const handlePrivateKeyChange = (e) => {
        const key = e.target.value;
        setAdminPrivateKey(key);
        localStorage.setItem('adminPrivateKey', key); // Simpan di browser
    };

    // Load data
    const loadData = async (menuTipe) => {
        setIsLoading(true);
        setMessage({ text: 'Mengambil data...', type: 'info' });
        setData([]);
        setMessages([]);
        setFiles([]);
        let url = '';

        if (menuTipe === 'enkripsi') url = '/admin/data-enkripsi';
        if (menuTipe === 'deskripsi') url = '/admin/data-deskripsi';
        if (menuTipe === 'pesan') url = '/admin/get-messages';
        if (menuTipe === 'vault') url = '/admin/vault/files';

        try {
            const res = await apiFetch(url);
            if(res && res.ok) {
                const result = await res.json();
                if (menuTipe === 'pesan') setMessages(result);
                else if (menuTipe === 'vault') setFiles(result);
                else setData(result);
                setMessage({ text: '', type: 'info' });
            } else {
                setMessage({ text: 'Gagal mengambil data', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'Gagal mengambil data', type: 'error' });
        }
        setIsLoading(false);
    };

    // (handleTambahUser TETAP SAMA)
    const handleTambahUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: 'Mendaftarkan agen...', type: 'info' });
        try {
            const res = await apiFetch('/admin/tambah-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username_agen: usernameAgen, password: password })
            });
            const result = await res.json();
            if(res.ok) {
                setMessage({ text: `AGEN BARU DIBUAT: ${result.user.username_agen} (KODE: ${result.user.kode_agen}).`, type: 'success' });
                setUsernameAgen('');
                setPassword('');
            } else {
                setMessage({ text: `Error: ${JSON.stringify(result.errors || result.message)}`, type: 'error' });
            }
        } catch(e) {
            setMessage({ text: 'Gagal terhubung ke server', type: 'error' });
        }
        setIsLoading(false);
    };

    // --- PERUBAHAN 2: Update dekripsi pesan (kirim Kunci Privat) ---
    const handleDecryptMessage = async (msg) => {
        if (!adminPrivateKey) {
            setMessage({ text: 'Error: Masukkan Kunci Privat Admin Anda terlebih dahulu.', type: 'error' });
            return;
        }
        setIsLoading(true);
        setDecryptedMessage('');
        setMessage({ text: 'Mendekripsi laporan...', type: 'info' });

        try {
            const res = await apiFetch('/admin/decrypt-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: msg.id,
                    admin_private_key: adminPrivateKey // <-- Kirim Kunci Privat
                })
            });

            const result = await res.json();
            if(res.ok) {
                setMessage({ text: `Laporan berhasil didekripsi. ${msg.read_once ? 'PESAN INI TELAH DIHANCURKAN.' : ''}`, type: 'success' });
                setDecryptedMessage(result.plaintext);
                if (msg.read_once) {
                    loadData('pesan');
                }
            } else {
                setMessage({ text: `Error: ${result.message}`, type: 'error' });
            }
        } catch(e) {
            setMessage({ text: 'Gagal terhubung ke server', type: 'error' });
        }
        setIsLoading(false);
    };

    // --- PERUBAHAN 3: Update download file (kirim Kunci Privat) ---
    const handleDownloadFile = async (file) => {
        if (!adminPrivateKey) {
            setMessage({ text: 'Error: Masukkan Kunci Privat Admin Anda terlebih dahulu.', type: 'error' });
            return;
        }
        setIsLoading(true);
        setMessage({ text: 'Mendekripsi dan mengunduh berkas...', type: 'info' });

        try {
            const res = await apiFetch('/admin/vault/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: file.id,
                    admin_private_key: adminPrivateKey // <-- Kirim Kunci Privat
                })
            });

            if (res && res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.original_filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setMessage({ text: 'Berkas berhasil diunduh.', type: 'success' });
            } else {
                const result = await res.json();
                setMessage({ text: `Error: ${result.message}`, type: 'error' });
            }
        } catch(e) {
            setMessage({ text: 'Gagal terhubung ke server', type: 'error' });
        }
        setIsLoading(false);
    };


    const handleMenuClick = (menuTipe) => {
        setMenu(menuTipe);
        setMessage({ text: '', type: 'info' });
        setDecryptedMessage(''); // Kosongkan hasil dekripsi lama
        if (menuTipe === 'enkripsi') loadData('enkripsi');
        if (menuTipe === 'deskripsi') loadData('deskripsi');
        if (menuTipe === 'pesan') loadData('pesan');
        if (menuTipe === 'vault') loadData('vault');
    };
    
    const baseTabClass = "py-3 px-5 font-semibold uppercase tracking-wider transition-all duration-300";
    const activeTabClass = "border-b-2 border-red-600 text-red-500";
    const inactiveTabClass = "text-gray-500 hover:text-gray-300 hover:border-b-2 hover:border-gray-700";

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white uppercase tracking-widest">Admin // <span className="text-red-600">Control</span></h1>
                <LogoutButton />
            </header>

            <nav className="flex flex-wrap gap-6 mb-6 border-b border-gray-800">
                <button onClick={() => handleMenuClick('tambah')} className={`${baseTabClass} ${menu === 'tambah' ? activeTabClass : inactiveTabClass}`}>Daftarkan Agen</button>
                <button onClick={() => handleMenuClick('enkripsi')} className={`${baseTabClass} ${menu === 'enkripsi' ? activeTabClass : inactiveTabClass}`}>Data Enkripsi</button>
                <button onClick={() => handleMenuClick('deskripsi')} className={`${baseTabClass} ${menu === 'deskripsi' ? activeTabClass : inactiveTabClass}`}>Data Deskripsi</button>
                <button onClick={() => handleMenuClick('pesan')} className={`${baseTabClass} ${menu === 'pesan' ? activeTabClass : inactiveTabClass}`}>Pesan Agen</button>
                <button onClick={() => handleMenuClick('vault')} className={`${baseTabClass} ${menu === 'vault' ? activeTabClass : inactiveTabClass}`}>Secure Vault</button>
            </nav>

            <Notification message={message} />

            <main className="bg-gray-900 border border-gray-800 rounded-none shadow-lg p-6 md:p-8">
                
                {menu === 'tambah' && (
                    // ... (Form Tambah User tetap sama) ...
                    <form onSubmit={handleTambahUser} className="max-w-md space-y-4">
                        <h2 className="text-2xl font-semibold mb-4 text-red-500">Merekrut Agen Baru</h2>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-400">Username Agen</label>
                            <input type="text" value={usernameAgen} onChange={(e) => setUsernameAgen(e.target.value)} required/>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-400">Password Awal</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                        </div>
                        <button type="submit" disabled={isLoading} className="py-3 px-6 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                            {isLoading ? "..." : "Rekrut"}
                        </button>
                    </form>
                )}

                {(menu === 'enkripsi' || menu === 'deskripsi') && (
                     // ... (Tabel Data Enkripsi/Deskripsi tetap sama) ...
                    <div className="overflow-x-auto">
                        <h2 className="text-2xl font-semibold mb-4 text-red-500">
                            {menu === 'enkripsi' ? 'Database Agen (Terenkripsi)' : 'Database Agen (Plaintext)'}
                        </h2>
                        {isLoading && <p className="text-blue-300">Mengambil data...</p>}
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                        {menu === 'enkripsi' ? 'Kode Agen' : 'Username Agen'}
                                    </th>
                                    <th className={`p-4 text-left text-sm font-semibold uppercase tracking-wider ${menu === 'deskripsi' ? 'text-red-500' : 'text-gray-400'}`}>
                                        {menu === 'enkripsi' ? 'Password (SHA-512 Hash)' : 'Password (Plaintext)'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {data.map((user, index) => (
                                    <tr key={index} className="hover:bg-gray-800 transition-colors duration-200">
                                        <td className="p-4 whitespace-nowrap">{user.kode_agen || user.username_agen}</td>
                                        <td className={`p-4 font-mono text-sm break-all ${menu === 'deskripsi' ? 'text-red-500' : 'text-gray-400'}`}>
                                            {user.password_hash || user.password_plaintext}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* --- PERUBAHAN 4: Konten "Pesan Agen" (Update) --- */}
                {menu === 'pesan' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-4 text-red-500">Intelijen Masuk (Scytale + AES + RSA)</h2>
                        
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-400">KUNCI PRIVAT ADMIN (RSA)</label>
                            <textarea 
                                value={adminPrivateKey} 
                                onChange={handlePrivateKeyChange} 
                                className="h-40"
                                placeholder="---BEGIN PRIVATE KEY---..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Kunci ini disimpan di browser-mu (localStorage) tapi tidak pernah disimpan di database.</p>
                        </div>

                        {decryptedMessage && (
                            <div className="p-4 bg-gray-800 rounded-none border border-green-700">
                                <h3 className="font-bold text-green-400">Laporan Berhasil Didekripsi:</h3>
                                <p className="mt-2 font-mono text-white whitespace-pre-wrap">{decryptedMessage}</p>
                            </div>
                        )}
                        
                        <div className="overflow-x-auto">
                            {isLoading && <p className="text-blue-300">Mengambil data intel...</p>}
                            <table className="min-w-full divide-y divide-gray-800">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Agen</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Waktu</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Kunci Scytale</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Laporan (Ciphertext)</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {messages.map((msg) => (
                                        <tr key={msg.id} className="hover:bg-gray-800 transition-colors duration-200">
                                            <td className="p-4 whitespace-nowrap">{msg.user?.username_agen || 'AGEN DIHAPUS'}</td>
                                            <td className="p-4 whitespace-nowrap">{new Date(msg.created_at).toLocaleString()}</td>
                                            <td className="p-4 font-mono text-center">{msg.scytale_key}</td>
                                            <td className="p-4 font-mono text-sm break-all max-w-xs truncate">
                                                {msg.read_once ? <span className="text-red-500" title="Pesan ini akan meledak">🔥 </span> : ''}
                                                {msg.ciphertext}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <button 
                                                    onClick={() => handleDecryptMessage(msg)}
                                                    disabled={isLoading || !adminPrivateKey}
                                                    className="py-2 px-4 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider hover:bg-red-800 disabled:bg-gray-600"
                                                >
                                                    {msg.read_once ? "Dekripsi & Hancurkan" : "Dekripsi"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- PERUBAHAN 5: Konten "Secure Vault" (Update) --- */}
                {menu === 'vault' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-4 text-red-500">Secure Vault (Camellia + RSA)</h2>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-400">KUNCI PRIVAT ADMIN (RSA)</label>
                            <textarea 
                                value={adminPrivateKey} 
                                onChange={handlePrivateKeyChange} 
                                className="h-40"
                                placeholder="---BEGIN PRIVATE KEY---..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Gunakan Kunci Privat yang sama dengan "Pesan Agen".</p>
                        </div>
                        <div className="overflow-x-auto">
                            {isLoading && <p className="text-blue-300">Mengambil daftar berkas...</p>}
                            <table className="min-w-full divide-y divide-gray-800">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Agen</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Waktu</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Nama Berkas Asli</th>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {files.map((file) => (
                                        <tr key={file.id} className="hover:bg-gray-800 transition-colors duration-200">
                                            <td className="p-4 whitespace-nowrap">{file.user?.username_agen || 'AGEN DIHAPUS'}</td>
                                            <td className="p-4 whitespace-nowrap">{new Date(file.created_at).toLocaleString()}</td>
                                            <td className="p-4 whitespace-nowrap">{file.original_filename}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <button 
                                                    onClick={() => handleDownloadFile(file)}
                                                    disabled={isLoading || !adminPrivateKey}
                                                    className="py-2 px-4 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider hover:bg-red-800 disabled:bg-gray-600"
                                                >
                                                    Download & Dekripsi
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}