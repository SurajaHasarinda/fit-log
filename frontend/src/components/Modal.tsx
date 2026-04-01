import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative glass rounded-2xl p-6 w-full ${maxWidth} animate-slide-up shadow-2xl shadow-brand/10`}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors text-xl leading-none cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
