import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

let idCounter = 0;
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((type, message, options = {}) => {
        const id = ++idCounter;
        const toast = { id, type, message, ...options };
        setToasts((t) => [...t, toast]);
        const duration = options.duration || 4000;
        setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== id));
        }, duration);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
    }, []);

    React.useEffect(() => {
        const handler = (e) => {
            const { type, message, duration } = e.detail || {};
            if (type && message) showToast(type, message, duration ? { duration } : {});
        };
        window.addEventListener('app:toast', handler);
        return () => window.removeEventListener('app:toast', handler);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export default ToastContext;
