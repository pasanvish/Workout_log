import React, { useEffect, useRef } from 'react';
import WorkoutHistory from './WorkoutHistory';
import { WorkoutLog, Profile, ProfilePRs } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkoutLog[];
  onImportLogs: (data: unknown) => void;
  onDeleteLog: (logId: string) => void;
  onUpdateLog: (log: WorkoutLog) => void;
  onExportLogs: () => void;
  activeProfile: Profile | undefined;
  personalRecords: ProfilePRs;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, logs, onImportLogs, onExportLogs, activeProfile, personalRecords, onDeleteLog, onUpdateLog }) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow;
    const trigger = document.activeElement;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector('button')?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-dvh w-full max-w-2xl bg-background-dark shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        inert={!isOpen}
        aria-hidden={!isOpen || undefined}
        role="dialog"
        aria-modal={isOpen || undefined}
        aria-labelledby="history-drawer-title"
      >
        <div className="h-full flex flex-col">
            <WorkoutHistory logs={logs} onImportLogs={onImportLogs} onExportLogs={onExportLogs} onClose={onClose} activeProfile={activeProfile} personalRecords={personalRecords} onDeleteLog={onDeleteLog} onUpdateLog={onUpdateLog} />
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;