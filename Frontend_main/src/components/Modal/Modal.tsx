import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  minHeight?: string;
  bodyClassName?: string;
}

const Modal = ({ isOpen, onClose, title, children, size = 'lg', minHeight, bodyClassName }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="modal-wrap">
        <div
          className={`modal-dialog modal-${size}`}
          style={minHeight ? { minHeight } : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={bodyClassName ? `modal-body ${bodyClassName}` : 'modal-body'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

