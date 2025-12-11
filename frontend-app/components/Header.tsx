'use client'

import { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from './Navigation'

export default function Header(): ReactElement {
    const router = useRouter()

    const handleLogoClick = () => {
        router.push('/home')
    }

    return (
        <header className="app-header">
            <div className="header-container">
                <div className="header-logo">
                    <Navigation />
                </div>
                <div className="header-title-center">
                    <h1 className="header-title" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        GLIM
                    </h1>
                </div>
            </div>
        </header>
    )
}

