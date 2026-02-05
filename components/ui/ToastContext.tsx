import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border w-80 transform transition-all duration-300 animate-in slide-in-from-right
              ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-200 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-200 text-blue-800' : ''}
              ${toast.type === 'warning' ? 'bg-white border-yellow-200 text-yellow-800' : ''}
            `}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle size={18} className="text-green-600" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-600" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-600" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-yellow-600" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};