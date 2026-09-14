import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    ArrowLeft,
    Trophy,
    QrCode,
    Compass,
    Sparkles,
    ShieldAlert,
    RefreshCw,
} from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-indigo-500/30">
            {/* Ambient Aurora Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-600/10 blur-[140px] rounded-full animate-aurora" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full animate-aurora-delayed" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-xl text-center space-y-8 animate-scale-pop">
                {/* Cyber Signal Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono tracking-widest uppercase shadow-lg shadow-rose-950/40">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <span>SIGNAL LOST // ERROR 404</span>
                </div>

                {/* Big Cyber Holographic 404 */}
                <div className="relative select-none my-2">
                    <h1 className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tighter bg-gradient-to-b from-white via-white/80 to-white/10 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                        404
                    </h1>
                    {/* Floating Compass Hologram */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-3xl bg-zinc-950/80 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-indigo-950/60 animate-levitate">
                        <div className="relative">
                            <Compass className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400" />
                            <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Description & Target URL display */}
                <div className="space-y-3 max-w-md mx-auto">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        Halaman Tidak Ditemukan di Ledger
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                        Sinyal terputus. Rute yang Anda tuju sepertinya salah ketik, telah dipindahkan, atau belum terdaftar dalam sistem pencatatan.
                    </p>
                    {location.pathname && (
                        <div className="inline-block mt-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-indigo-300 max-w-full truncate">
                            Target: <span className="text-white/80">{location.pathname}</span>
                        </div>
                    )}
                </div>

                {/* Cyber Action Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="group p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-transparent border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex items-center gap-3 glass-cyber-card hover:-translate-y-0.5"
                    >
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                            <Home className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                Kembali ke Beranda
                            </p>
                            <p className="text-[10px] text-white/50 truncate">
                                Dashboard utama kas kelas
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/leaderboard')}
                        className="group p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center gap-3 glass-cyber-card hover:-translate-y-0.5"
                    >
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 transition-transform">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                                Leaderboard Kas
                            </p>
                            <p className="text-[10px] text-white/50 truncate">
                                Cek peringkat donatur & lunas
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/qr-payment')}
                        className="group p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center gap-3 glass-cyber-card hover:-translate-y-0.5"
                    >
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                                Bayar Kas QRIS
                            </p>
                            <p className="text-[10px] text-white/50 truncate">
                                Konfirmasi pembayaran instan
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 transition-all flex items-center gap-3 glass-cyber-card hover:-translate-y-0.5"
                    >
                        <div className="p-2.5 rounded-xl bg-white/5 text-white/70 border border-white/10 group-hover:scale-110 transition-transform">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-white/90 transition-colors">
                                Halaman Sebelumnya
                            </p>
                            <p className="text-[10px] text-white/50 truncate">
                                Mundur ke halaman terakhir
                            </p>
                        </div>
                    </button>
                </div>

                {/* System Status Footnote */}
                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40 font-mono">
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        System Engine: Online
                    </span>
                    <span>Kas Kelas TRIFORCE</span>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
