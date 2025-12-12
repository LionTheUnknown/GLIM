'use client'

import { ReactElement, useState, useEffect } from 'react'
import Modal from './Modal'
import { Button } from 'primereact/button'
import { isAdmin } from '@/utils/auth'

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
    const [isAdminUser, setIsAdminUser] = useState(false)
    const [reviveModalVisible, setReviveModalVisible] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingRevive, setLoadingRevive] = useState(false)
    const [loadingPin, setLoadingPin] = useState(false)

    useEffect(() => {
        setIsAdminUser(isAdmin())
        
        // Listen for storage changes (login/logout)
        const handleStorageChange = () => {
            setIsAdminUser(isAdmin())
        }
        
        window.addEventListener('storage', handleStorageChange)
        
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    if (!isAdminUser) return <></>

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

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleDelete()
    }

    const handleReviveClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setReviveModalVisible(true)
    }

    const handlePinClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handlePin()
    }

    return (
        <>
            <div className="dev-tools">
                <button
                    className="dev-tools-btn dev-tools-btn-danger"
                    onClick={handleDeleteClick}
                    disabled={loadingDelete}
                    title="Delete post"
                >
                    <i className={loadingDelete ? "pi pi-spin pi-spinner" : "pi pi-trash"} />
                </button>
                <button
                    className="dev-tools-btn dev-tools-btn-warning"
                    onClick={handleReviveClick}
                    disabled={loadingRevive}
                    title="Revive post"
                >
                    <i className={loadingRevive ? "pi pi-spin pi-spinner" : "pi pi-refresh"} />
                </button>
                <button
                    className="dev-tools-btn dev-tools-btn-pin"
                    onClick={handlePinClick}
                    disabled={loadingPin}
                    title={isPinned ? "Unpin post" : "Pin post"}
                    data-pinned={isPinned}
                >
                    <i className={loadingPin ? "pi pi-spin pi-spinner" : isPinned ? "pi pi-bookmark-fill" : "pi pi-bookmark"} />
                </button>
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

