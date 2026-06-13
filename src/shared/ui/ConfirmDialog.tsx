import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  destructive  = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={(
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-pill text-sm font-medium transition-transform active:scale-[0.98]"
            style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-pill text-sm font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: destructive ? 'var(--status-alert)' : 'var(--accent)',
              color:      destructive ? '#FFFFFF' : 'var(--accent-on)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      )}
    >
      <p className="text-sm leading-relaxed py-2" style={{ color: 'var(--ink-2)' }}>
        {message}
      </p>
    </Modal>
  );
}
