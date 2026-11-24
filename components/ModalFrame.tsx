import React, { useEffect, useId, useRef } from 'react';

interface ModalFrameProps {
  title: string;
  onClose: () => void;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export default function ModalFrame({ title, onClose, description, children, footer, wide }: ModalFrameProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`app-dialog ${wide ? 'app-dialog-wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const { top, right, bottom, left } = event.currentTarget.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) onClose();
      }}
    >
      <div className="app-dialog-layout">
        <header className="app-dialog-header">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-xl font-bold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm leading-snug text-text-secondary">{description}</p>}
          </div>
          <button type="button" className="icon-action" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
            <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="app-dialog-content">{children}</div>
        {footer && <footer className="app-dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
