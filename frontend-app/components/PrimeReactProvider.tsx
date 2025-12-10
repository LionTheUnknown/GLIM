'use client'

import { PrimeReactProvider as PRProvider } from 'primereact/api'
import { Toast } from 'primereact/toast'
import { useRef, useEffect } from 'react'
import 'primereact/resources/themes/lara-dark-cyan/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

export const toastRef = { current: null as any }

export default function PrimeReactProviderWrapper({ children }: { children: React.ReactNode }) {
    const toast = useRef<Toast>(null)
    
    useEffect(() => {
        toastRef.current = toast.current
    }, [])

    return (
        <PRProvider>
            <Toast ref={toast} position="top-right" />
            {children}
        </PRProvider>
    )
}

