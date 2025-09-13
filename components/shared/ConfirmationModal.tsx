import React from 'react';
import Modal from './Modal.tsx';

const ConfirmationModal = ({ 
    message, 
    onConfirm, 
    onCancel, 
    show, 
    confirmText = 'تایید', 
    confirmButtonClass = 'bg-red-500 hover:bg-red-600' 
}) => {
  return (
    <Modal show={show} onClose={onCancel} maxWidth="max-w-md">
        <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">تایید عملیات</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={onCancel} 
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    لغو
                </button>
                <button 
                    onClick={onConfirm} 
                    className={`w-full text-white font-bold py-3 px-6 rounded-lg transition-colors ${confirmButtonClass}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmationModal;