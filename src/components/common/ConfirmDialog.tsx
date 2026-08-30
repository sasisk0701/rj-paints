import { memo, type ReactNode } from 'react';
import { Modal } from 'antd';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmText?: string;
  type?: 'danger' | 'warn';
}

function ConfirmDialogBase({
  open, title, description, onCancel, onConfirm,
  loading = false, confirmText = 'Delete', type = 'danger',
}: ConfirmDialogProps) {
  const isDanger = type === 'danger';

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={420}
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
      <div className="px-6 py-6">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          isDanger ? 'bg-danger-soft' : 'bg-warn-soft'
        }`}>
          {isDanger
            ? <Trash2 size={22} className="text-danger" />
            : <AlertTriangle size={22} className="text-warn" />
          }
        </div>

        {/* Title */}
        <div className="text-[16px] font-bold text-ink mb-1">{title}</div>

        {/* Description */}
        {description && (
          <div className="text-[13px] text-ink-3 leading-relaxed">{description}</div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-surface-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export const ConfirmDialog = memo(ConfirmDialogBase);
