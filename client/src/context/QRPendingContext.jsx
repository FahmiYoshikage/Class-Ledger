import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { qrPaymentAPI } from '../services/api';

const QRPendingContext = createContext({
    pendingCount: 0,
    refreshPendingCount: () => {},
});

export const QRPendingProvider = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);

    const refreshPendingCount = useCallback(async () => {
        try {
            const res = await qrPaymentAPI.getPendingCount();
            if (res.data?.success) {
                setPendingCount(Number(res.data.count) || 0);
            }
        } catch {
            // Silently fallback if offline or unauthorized
        }
    }, []);

    useEffect(() => {
        refreshPendingCount();

        // Polling setiap 30 detik agar admin real-time mengetahui ada transfer baru
        const interval = setInterval(refreshPendingCount, 30000);

        // Langsung refresh saat tab browser kembali dibuka / aktif (visibilitychange)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshPendingCount();
            }
        };

        const handleFocus = () => {
            refreshPendingCount();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [refreshPendingCount]);

    return (
        <QRPendingContext.Provider value={{ pendingCount, refreshPendingCount }}>
            {children}
        </QRPendingContext.Provider>
    );
};

export const useQRPending = () => useContext(QRPendingContext);
