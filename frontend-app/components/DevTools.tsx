'use client'

import { ReactElement, useState, useEffect } from 'react'
import { Button } from 'primereact/button'
import Modal from './Modal'
import { isDevMode } from '@/utils/devMode'

interface RevivePostModalProps {
    visible: boolean
    onHide: () => void
    onConfirm: (duration: number) => Promise<void>
    postId: number
}

function RevivePostModal({ visible, onHide, onConfirm, postId }: RevivePostModalProps): ReactElement {
    const [selectedDuration, setSelectedDuration] = useState<number>(60)
    const [loading, setLoading] = useState(false)

    const handleConfirmWithLoading = async () => {
        setLoading(true)
        try {
            await onConfirm(selectedDuration)
            onHide()
        } finally {
            setLoading(false)
        }
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} outlined disabled={loading} />
            <Button label="Revive" icon="pi pi-refresh" onClick={handleConfirmWithLoading} loading={loading} disabled={loading} />
        </>
    )

    return (
        <Modal
            visible={visible}
            onHide={onHide}
            title="Revive Post"
            footer={footer}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Select new expiration duration for post #{postId}:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button
                        label="1 minute"
                        onClick={() => setSelectedDuration(1)}
                        className={selectedDuration === 1 ? '' : 'p-button-outlined'}
                        size="small"
                    />
                    <Button
                        label="1 hour"
                        onClick={() => setSelectedDuration(60)}
                        className={selectedDuration === 60 ? '' : 'p-button-outlined'}
                        size="small"
                    />
                    <Button
                        label="1 day"
                        onClick={() => setSelectedDuration(1440)}
                        className={selectedDuration === 1440 ? '' : 'p-button-outlined'}
                        size="small"
                    />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Selected: {selectedDuration === 1 ? '1 minute' : selectedDuration === 60 ? '1 hour' : '1 day'}
                </p>
            </div>
        </Modal>
    )
}

interface DevToolsProps {
    postId: number
    onDelete?: () => void
    onRevive?: (duration: number) => void
    onPin?: () => void
    isPinned?: boolean
}

export default function DevTools({ postId, onDelete, onRevive, onPin, isPinned }: DevToolsProps): ReactElement {
    const [devMode, setDevMode] = useState(false)
    const [reviveModalVisible, setReviveModalVisible] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingRevive, setLoadingRevive] = useState(false)
    const [loadingPin, setLoadingPin] = useState(false)

    useEffect(() => {
        setDevMode(isDevMode())
        
        const handleDevModeChange = (e: CustomEvent) => {
            setDevMode(e.detail)
        }
        
        window.addEventListener('devModeChanged', handleDevModeChange as EventListener)
        
        return () => {
            window.removeEventListener('devModeChanged', handleDevModeChange as EventListener)
        }
    }, [])

    if (!devMode) return <></>

    const handleRevive = async (duration: number) => {
        if (onRevive) {
            setLoadingRevive(true)
            try {
                await onRevive(duration)
            } finally {
                setLoadingRevive(false)
            }
        }
    }

    const handleDelete = async () => {
        if (onDelete) {
            setLoadingDelete(true)
            try {
                await onDelete()
            } finally {
                setLoadingDelete(false)
            }
        }
    }

    const handlePin = async () => {
        if (onPin) {
            setLoadingPin(true)
            try {
                await onPin()
            } finally {
                setLoadingPin(false)
            }
        }
    }

    return (
        <>
            <div className="dev-tools">
                <Button
                    icon="pi pi-trash"
                    onClick={handleDelete}
                    severity="danger"
                    size="small"
                    outlined
                    loading={loadingDelete}
                    disabled={loadingDelete}
                    title="Delete post (dev mode)"
                />
                <Button
                    icon="pi pi-refresh"
                    onClick={() => setReviveModalVisible(true)}
                    severity="warning"
                    size="small"
                    outlined
                    loading={loadingRevive}
                    disabled={loadingRevive}
                    title="Revive post (dev mode)"
                />
                <Button
                    icon={isPinned ? "pi pi-bookmark-fill" : "pi pi-bookmark"}
                    onClick={handlePin}
                    severity={isPinned ? "success" : "secondary"}
                    size="small"
                    outlined
                    loading={loadingPin}
                    disabled={loadingPin}
                    title={isPinned ? "Unpin post (dev mode)" : "Pin post (dev mode)"}
                />
            </div>
            <RevivePostModal
                visible={reviveModalVisible}
                onHide={() => setReviveModalVisible(false)}
                onConfirm={handleRevive}
                postId={postId}
            />
        </>
    )
}

