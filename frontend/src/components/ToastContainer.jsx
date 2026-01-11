import React from 'react';
import { useToast } from '../context/ToastContext';

const ToastItem = ({ toast, onClose }) => {
    const color = toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800';
    return (
        <div className={`text-white px-4 py-3 rounded shadow ${color} mb-2 w-80`}>
            <div className="flex justify-between items-start gap-2">
                <div className="text-sm">{toast.message}</div>
                <button onClick={() => onClose(toast.id)} className="ml-4 font-bold">×</button>
            </div>
        </div>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 9999 }}>
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onClose={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;
