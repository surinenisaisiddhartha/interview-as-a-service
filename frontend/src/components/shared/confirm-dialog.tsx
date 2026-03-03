import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-gray-600 text-sm mb-6">{description}</p>
            <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
                <Button
                    onClick={() => { onConfirm(); onClose(); }}
                    variant={isDestructive ? 'destructive' : 'default'}
                >
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
