import { memo, type ReactNode } from 'react';
import { Modal } from 'antd';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface AppModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  width?: number;
  children: ReactNode;
  danger?: boolean;
}

function AppModalBase({
  open, title, subtitle, onClose, onConfirm,
  confirmText = 'Save', cancelText = 'Cancel',
  loading = false, width = 520, children, danger = false,
}: AppModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={width}
      closeIcon={null}
      destroyOnClose
      styles={{
        content: {
          borderRadius: 20,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
        },
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.45)' },
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-border">
        <div>
          <div className="text-[16px] font-bold text-ink">{title}</div>
          {subtitle && <div className="text-xs text-ink-3 mt-0.5">{subtitle}</div>}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>

      {/* Footer */}
      {onConfirm && (
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-surface-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'dangerGhost' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Saving…' : confirmText}
          </Button>
        </div>
      )}
    </Modal>
  );
}

export const AppModal = memo(AppModalBase);
