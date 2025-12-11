'use client'

import { ReactElement, ReactNode } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'

interface ModalProps {
    visible: boolean
    onHide: () => void
    title: string
    children: ReactNode
    footer?: ReactNode
    className?: string
}

export default function Modal({ visible, onHide, title, children, footer, className }: ModalProps): ReactElement {
    const defaultFooter = (
        <Button
            label="Close"
            icon="pi pi-times"
            onClick={onHide}
            outlined
        />
    )

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={title}
            footer={footer || defaultFooter}
            className={`custom-modal ${className || ''}`}
            modal
            dismissableMask
        >
            {children}
        </Dialog>
    )
}

