'use client'

import { ReactElement } from 'react'
import { usePathname } from 'next/navigation'

const HIDE_FOOTER_PATHS = ['/login', '/register']

export default function Footer(): ReactElement | null {
    const pathname = usePathname()

    if (pathname && HIDE_FOOTER_PATHS.some(p => pathname.startsWith(p))) {
        return null
    }

    return (
        <footer className="app-footer">
            <div className="footer-container">
                <p className="footer-text">
                    © 2025 GLIM. All rights reserved.
                </p>
                <p className="footer-subtext">
                    The first candle-like
                </p>
            </div>
        </footer>
    )
}
