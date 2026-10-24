'use client';

import { useEffect, useRef } from 'react';

export default function Modal({ children, onClose, label, labelledBy, busy = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  function closeOnBackdrop(event) {
    if (busy || event.target !== ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) onClose();
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={label}
      aria-labelledby={labelledBy}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={closeOnBackdrop}
    >
      <button
        className="modalClose"
        type="button"
        disabled={busy}
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>
      {children}
    </dialog>
  );
}
