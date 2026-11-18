import { createContext, useContext } from 'react';
export const ToastContext = createContext<(key: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
