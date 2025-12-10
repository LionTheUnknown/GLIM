import { toastRef } from '@/components/PrimeReactProvider'

type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

export const showToast = (severity: ToastSeverity, summary: string, detail?: string, life: number = 3000) => {
    if (toastRef.current) {
        toastRef.current.show({
            severity,
            summary,
            detail,
            life
        })
    } else {
        // Fallback to console if toast not ready
        console.log(`[${severity.toUpperCase()}] ${summary}${detail ? `: ${detail}` : ''}`)
    }
}

export const toast = {
    success: (message: string, detail?: string) => showToast('success', message, detail),
    error: (message: string, detail?: string) => showToast('error', message, detail),
    info: (message: string, detail?: string) => showToast('info', message, detail),
    warn: (message: string, detail?: string) => showToast('warn', message, detail),
}
