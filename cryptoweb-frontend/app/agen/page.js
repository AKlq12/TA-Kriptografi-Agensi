// app/agen/page.js
'use client';
import { useState, useEffect } from 'react';

// --- (Komponen apiPost, LogoutButton, Notification TETAP SAMA) ---
const apiPost = async (url, body, isFormData = false) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`http://127.0.0.1:8000/api${url}`, {
        method: 'POST',
        headers: headers,
        body: isFormData ? body : JSON.stringify(body),
    });
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
        await apiPost('/logout', new FormData(), true); 
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


export default function AgenDashboard() {
    // --- PERUBAHAN 1: Ganti 'text' ke 'laporan' ---
    const [menu, setMenu] = useState('laporan'); // 'laporan', 'target', 'vault'
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [isLoading, setIsLoading] = useState(false);

    // --- PERUBAHAN 2: Hapus Kunci AES dari Laporan ---
    const [plaintext, setPlaintext] = useState('Target terlihat di Sektor 7. Memulai observasi.');
    const [scytaleKey, setScytaleKey] = useState(5); 
    // const [aesKey, setAesKey] = useState('OperasiMalamIni'); // <-- HAPUS
    const [readOnce, setReadOnce] = useState(false);

    // State Database Target (Camellia + LSB) - TETAP SAMA
    const [stegoText, setStegoText] = useState('CEO, Pria, 50thn, Sering jogging pagi.');
    const [stegoKey, setStegoKey] = useState('kunciRahasia123'); 
    const [encodeImage, setEncodeImage] = useState(null); 
    const [decodeImage, setDecodeImage] = useState(null); 
    const [encodedImageUrl, setEncodedImageUrl] = useState(null); 
    const [decodedMessage, setDecodedMessage] = useState('');

    // --- PERUBAHAN 3: State baru untuk Secure Vault ---
    const [uploadFile, setUploadFile] = useState(null);
    // (Kunci fileKey tidak lagi dibutuhkan di sini, akan di-generate)

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'agen') {
            localStorage.clear();
            window.location.href = '/';
        }
    }, []);
    
    // --- PERUBAHAN 4: Update Fungsi Kirim Laporan ---
    const handleSendMessage = async () => {
        setMessage({ text: 'Mengirim laporan terenkripsi...', type: 'info' });
        setIsLoading(true);
        
        const res = await apiPost('/agen/send-message', { 
            text: plaintext, 
            scytale_key: scytaleKey,
            // aes_key HILANG
            read_once: readOnce
        });

        if (res && res.ok) {
            const data = await res.json();
            setMessage({ text: data.message, type: 'success' });
            setPlaintext('');
            setReadOnce(false);
        } else {
            const data = await res.json();
            setMessage({ text: `Error: ${data.message}`, type: 'error' });
        }
        setIsLoading(false);
    };
    
    // --- (Fungsi Steganografi/Target - Tetap Sama) ---
    const handleEncodeImage = async (e) => {
        e.preventDefault();
        if (!encodeImage) {
            setMessage({ text: 'Pilih foto target terlebih dahulu.', type: 'error' });
            return;
        }
        setMessage({ text: 'Mengenkripsi (Camellia) lalu menyembunyikan (LSB)...', type: 'info' });
        setIsLoading(true);
        setEncodedImageUrl(null);
        const formData = new FormData();
        formData.append('image', encodeImage);
        formData.append('text', stegoText);
        formData.append('key', stegoKey);
        const res = await apiPost('/agen/stego/encode', formData, true);
        if (res && res.ok) {
            const imageBlob = await res.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            setEncodedImageUrl(imageUrl);
            setMessage({ text: 'Data Intel berhasil disembunyikan.', type: 'success' });
        } else {
            const data = await res.json();
            setMessage({ text: `Error: ${data.message || 'Gagal encode gambar.'}`, type: 'error' });
        }
        setIsLoading(false);
    };
    const handleDecodeImage = async (e) => {
        e.preventDefault();
        if (!decodeImage) {
            setMessage({ text: 'Pilih berkas intel terlebih dahulu.', type: 'error' });
            return;
        }
        setMessage({ text: 'Mengekstrak (LSB) lalu mendekripsi (Camellia)...', type: 'info' });
        setIsLoading(true);
        setDecodedMessage('');
        const formData = new FormData();
        formData.append('image', decodeImage);
        formData.append('key', stegoKey);
        const res = await apiPost('/agen/stego/decode', formData, true);
        if (res && res.ok) {
            const data = await res.json();
            setDecodedMessage(data.secret_message);
            setMessage({ text: 'Data Intel berhasil diekstrak.', type: 'success' });
        } else {
            const data = await res.json();
            setMessage({ text: `Error: ${data.message || 'Gagal decode gambar.'}`, type: 'error' });
        }
        setIsLoading(false);
    };

    // --- PERUBAHAN 5: Fungsi baru untuk Upload Secure Vault ---
    const handleUploadFile = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            setMessage({ text: 'Pilih berkas terlebih dahulu.', type: 'error' });
            return;
        }
        setMessage({ text: 'Mengenkripsi dan mengunggah berkas ke Vault...', type: 'info' });
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', uploadFile);
        // (Tidak perlu kirim 'key')

        const res = await apiPost('/agen/vault/upload', formData, true);
        
        if (res && res.ok) {
            const data = await res.json();
            setMessage({ text: data.message, type: 'success' });
            setUploadFile(null); 
            document.getElementById('vault-file-input').value = null; 
        } else {
            const data = await res.json();
            setMessage({ text: `Error: ${data.message || 'Gagal upload berkas.'}`, type: 'error' });
        }
        setIsLoading(false);
    };
    
    
    const baseTabClass = "py-3 px-5 font-semibold uppercase tracking-wider transition-all duration-300";
    const activeTabClass = "border-b-2 border-blue-600 text-blue-500";
    const inactiveTabClass = "text-gray-500 hover:text-gray-300 hover:border-b-2 hover:border-gray-700";

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white uppercase tracking-widest">Agen // <span className="text-blue-500">Operasi</span></h1>
                <LogoutButton />
            </header>
            
            {/* --- PERUBAHAN 6: Label Tab --- */}
            <nav className="flex flex-wrap gap-6 mb-6 border-b border-gray-800">
                <button onClick={() => setMenu('laporan')} className={`${baseTabClass} ${menu === 'laporan' ? activeTabClass : inactiveTabClass}`}>Kirim Laporan</button>
                <button onClick={() => setMenu('target')} className={`${baseTabClass} ${menu === 'target' ? activeTabClass : inactiveTabClass}`}>Database Target</button>
                <button onClick={() => setMenu('vault')} className={`${baseTabClass} ${menu === 'vault' ? activeTabClass : inactiveTabClass}`}>Secure Vault</button>
            </nav>

            <Notification message={message} />
            {isLoading && !message.text && <p className="mb-4 text-blue-300">Memproses...</p>}

            {/* --- PERUBAHAN 7: Menu Kirim Laporan (Hapus Kunci AES) --- */}
            {menu === 'laporan' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-900 border border-gray-800 rounded-none p-6 space-y-4">
                        <h2 className="text-2xl font-semibold text-blue-500">Kirim Laporan Rahasia (Scytale + AES + RSA)</h2>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-400">Isi Laporan (Plaintext)</label>
                            <textarea value={plaintext} onChange={(e) => setPlaintext(e.target.value)} className="h-40"/>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-400">Kunci Scytale (Angka Baris)</label>
                            <input 
                                type="number" 
                                value={scytaleKey} 
                                onChange={(e) => setScytaleKey(parseInt(e.target.value) || 2)} 
                                className="w-full px-4 py-3 border rounded-none bg-gray-800 border-gray-700"
                            />
                        </div>
                        
                        {/* Kunci Sesi AES Dihapus dari sini */}
                        
                        <div className="flex items-center">
                            <input 
                                id="read_once"
                                type="checkbox"
                                checked={readOnce}
                                onChange={(e) => setReadOnce(e.target.checked)}
                                className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded-none focus:ring-red-500"
                            />
                            <label htmlFor="read_once" className="ml-2 text-sm font-medium text-red-500">🔥 HANCURKAN SETELAH DIBACA</label>
                        </div>
                        <button onClick={handleSendMessage} disabled={isLoading} className="w-full py-3 px-6 bg-blue-600 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                            {isLoading ? "Mengirim..." : "Kirim Laporan"}
                        </button>
                    </div>
                </div>
            )}
            
            {/* --- Database Target (TETAP SAMA, tidak pakai RSA) --- */}
            {menu === 'target' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-none p-6 space-y-4">
                        <h2 className="text-2xl font-semibold text-blue-500">Sembunyikan Data Intel (Camellia + LSB)</h2>
                        <form onSubmit={handleEncodeImage} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Upload Foto Target (Cover)</label>
                                <input type="file" accept=".png,.jpg,.jpeg,.gif" onChange={(e) => setEncodeImage(e.target.files[0])} required/>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Data Intel (Plaintext)</label>
                                <textarea value={stegoText} onChange={(e) => setStegoText(e.target.value)} required/>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Kunci Enkripsi (Camellia)</label>
                                <input type="password" value={stegoKey} onChange={(e) => setStegoKey(e.target.value)} required/>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-6 bg-blue-600 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                                {isLoading ? "Memproses..." : "Sembunyikan Data"}
                            </button>
                        </form>
                        
                        {encodedImageUrl && (
                            <div className="mt-4 space-y-2">
                                <h3 className="font-bold text-gray-300">Berkas Intel (Hasil):</h3>
                                <img src={encodedImageUrl} alt="Hasil Steganografi" className="max-w-xs mt-2 rounded-none border border-gray-700"/>
                                <a href={encodedImageUrl} download="berkas-intel.png" className="inline-block mt-2 py-2 px-4 bg-gray-600 rounded-none text-white font-semibold hover:bg-gray-700 transition-colors duration-200 uppercase tracking-wider">
                                    Download Berkas
                                </a>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-gray-900 border border-gray-800 rounded-none p-6 space-y-4">
                        <h2 className="text-2xl font-semibold text-red-500">Ekstrak Data Intel (Camellia + LSB)</h2>
                        <form onSubmit={handleDecodeImage} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Upload Berkas Intel</label>
                                <input type="file" accept=".png,.jpg,.jpeg,.gif" onChange={(e) => setDecodeImage(e.target.files[0])} required/>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Kunci Enkripsi (Camellia)</label>
                                <input type="password" value={stegoKey} onChange={(e) => setStegoKey(e.target.value)} required/>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-6 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                                {isLoading ? "Memproses..." : "Ekstrak Data"}
                            </button>
                        </form>
                        
                        {decodedMessage && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-none">
                                <h3 className="font-bold text-gray-300">Data Intel Ditemukan:</h3>
                                <p className="mt-2 font-mono text-white whitespace-pre-wrap">{decodedMessage}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- PERUBAHAN 8: Menu baru "Secure Vault" --- */}
            {menu === 'vault' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-900 border border-gray-800 rounded-none p-6 space-y-4">
                        <h2 className="text-2xl font-semibold text-blue-500">Secure Vault (Upload Berkas Terenkripsi)</h2>
                        <p className="text-sm text-gray-400">Berkas akan dienkripsi dengan kunci Camellia acak, yang kemudian dienkripsi lagi dengan Kunci Publik Admin (RSA).</p>
                        <form onSubmit={handleUploadFile} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Upload Berkas (PDF, ZIP, TXT, dll)</label>
                                <input 
                                    id="vault-file-input"
                                    type="file" 
                                    onChange={(e) => setUploadFile(e.target.files[0])} 
                                    required
                                />
                            </div>
                            
                            {/* Kunci Dihapus dari sini */}
                            
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-6 bg-blue-600 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                                {isLoading ? "Mengunggah..." : "Upload ke Vault"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}