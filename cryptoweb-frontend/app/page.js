'use client';
import { useState } from 'react';

export default function Home() {
    const [role, setRole] = useState('admin');
    const [username, setUsername] = useState('admin');
    const [adminPassword, setAdminPassword] = useState('123');
    const [kodeAgen, setKodeAgen] = useState('');
    
    // --- PERUBAHAN 1: Ganti nama state ---
    const [agenPassword, setAgenPassword] = useState(''); // <-- Bukan lagi hashPassword
    
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        
        let body;
        if (role === 'admin') {
            body = JSON.stringify({
                role: 'admin',
                username: username,
                password: adminPassword
            });
        } else {
            // --- PERUBAHAN 2: Kirim 'password' (plaintext) ---
            body = JSON.stringify({
                role: 'agen',
                kode_agen: kodeAgen,
                password: agenPassword // <-- Bukan lagi password_hash
            });
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: body,
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', data.role);
                
                if (data.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/agen';
                }
            } else {
                setMessage(`Error: ${data.message}`);
            }
        } catch (error) {
            setMessage('Tidak bisa terhubung ke server. Pastikan backend berjalan.');
        }
        setIsLoading(false);
    };

    const baseTabClass = "w-1/2 p-3 font-semibold transition-all duration-300";
    const activeTabClass = "bg-gray-800 text-red-500 border-b-2 border-red-500";
    const inactiveTabClass = "bg-gray-900 text-gray-500 hover:bg-gray-800";

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md space-y-6 bg-gray-900 border border-red-900/50 rounded-none shadow-2xl shadow-red-900/10">
                <h1 className="text-3xl font-bold p-6 bg-gray-950 border-b border-red-900/50 text-center text-red-500">
                    SISTEM AGENSI
                </h1>
                
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setRole('admin')}
                        className={`${baseTabClass} ${role === 'admin' ? activeTabClass : inactiveTabClass}`}>
                        ADMIN
                    </button>
                    <button
                        onClick={() => setRole('agen')}
                        className={`${baseTabClass} ${role === 'agen' ? activeTabClass : inactiveTabClass}`}>
                        AGEN
                    </button>
                </div>

                {message && <p className="text-sm text-yellow-400 text-center px-8">{message}</p>}

                <div className="p-8 pt-0">
                    {role === 'admin' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Username Admin</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Password</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-5 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                                {isLoading ? "..." : "AUTENTIKASI"}
                            </button>
                        </form>
                    )}

                    {/* --- PERUBAHAN 3: Ubah Form Agen --- */}
                    {role === 'agen' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Kode Agen</label>
                                <input
                                    type="text"
                                    value={kodeAgen}
                                    onChange={(e) => setKodeAgen(e.target.value)}
                                    placeholder="AGEN-XXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-400">Password</label>
                                <input
                                    type="password" // <-- UBAH TYPE
                                    value={agenPassword} // <-- UBAH STATE
                                    onChange={(e) => setAgenPassword(e.target.value)} // <-- UBAH STATE
                                    placeholder="Masukkan password Anda..." // <-- UBAH PLACEHOLDER
                                />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-5 bg-red-700 rounded-none text-white font-semibold uppercase tracking-wider shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-500">
                                {isLoading ? "..." : "AUTENTIKASI"}
                            </button>
                        </form>
                    )}
                    {/* --- AKHIR PERUBAHAN --- */}
                </div>
            </div>
        </div>
    );
}