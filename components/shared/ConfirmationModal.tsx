
import React from 'react';
import Modal from './Modal.tsx';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  show: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel, show }) => {
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
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    تایید
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmationModal;