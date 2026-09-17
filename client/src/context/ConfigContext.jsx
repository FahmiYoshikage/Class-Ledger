import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_CONFIG = {
    className: 'Kas Kelas',
    institutionName: '',
    semesterName: 'Semester 1',
    description: '',
    weeklyAmount: 2000,
    lateThreshold: 4,
    startDate: '2025-10-27',
    paymentAccounts: [],
    paymentNotes: '',
    semesterStatus: 'active',
    accumulatedWeeks: 7,
};

const ConfigContext = createContext({
    config: DEFAULT_CONFIG,
    setupCompleted: true,
    hasAdmin: true,
    loading: true,
    refreshConfig: async () => {},
});

export const useAppConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useAppConfig must be used within ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [setupCompleted, setSetupCompleted] = useState(null); // null = unknown/loading
    const [hasAdmin, setHasAdmin] = useState(true);
    const [loading, setLoading] = useState(true);

    const loadConfig = useCallback(async () => {
        try {
            // 1. Fetch setup status
            const statusRes = await api.get('/setup/status').catch(() => null);

            if (statusRes?.data) {
                setSetupCompleted(Boolean(statusRes.data.setupCompleted));
                setHasAdmin(Boolean(statusRes.data.hasAdmin));
            } else {
                // If endpoint unreachable or error, assume setup completed to not block UI
                setSetupCompleted(true);
            }

            // 2. Fetch public configuration
            const publicRes = await api.get('/settings/public').catch(() => null);

            if (publicRes?.data) {
                setConfig((prev) => ({
                    ...prev,
                    ...publicRes.data,
                    weeklyAmount: Number(publicRes.data.weeklyAmount) || 2000,
                    lateThreshold: Number(publicRes.data.lateThreshold) || 4,
                    className: publicRes.data.className || prev.className,
                }));
            }
        } catch (error) {
            console.error('Error loading app configuration:', error);
            setSetupCompleted(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    return (
        <ConfigContext.Provider
            value={{
                config,
                setupCompleted,
                hasAdmin,
                loading,
                refreshConfig: loadConfig,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;
