'use client'

import { ReactElement, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from 'primereact/button'
import { isAuthenticated } from '@/utils/auth'

export default function Navigation(): ReactElement {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false)
            }
        }
        
        handleResize()
        window.addEventListener('resize', handleResize)
        
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    const loggedIn = isAuthenticated()

    const handleNavClick = (path: string) => {
        router.push(path)
        setIsMobileMenuOpen(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        router.push('/login')
        setIsMobileMenuOpen(false)
    }

    return (
        <>
            <nav className="navigation">
                <Button
                    icon={isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="hamburger-button"
                    text
                    aria-label="Toggle menu"
                />
                {isMobileMenuOpen && (
                    <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                            <Button
                                label="Home"
                                icon="pi pi-home"
                                onClick={() => handleNavClick('/home')}
                                className={pathname === '/home' ? 'active' : ''}
                                text
                                style={{ width: '100%', justifyContent: 'flex-start' }}
                            />
                            {loggedIn ? (
                                <>
                                    <Button
                                        label="Profile"
                                        icon="pi pi-user"
                                        onClick={() => handleNavClick('/profile')}
                                        className={pathname === '/profile' ? 'active' : ''}
                                        text
                                        style={{ width: '100%', justifyContent: 'flex-start' }}
                                    />
                                    <Button
                                        label="Logout"
                                        icon="pi pi-sign-out"
                                        onClick={handleLogout}
                                        text
                                        style={{ width: '100%', justifyContent: 'flex-start' }}
                                    />
                                </>
                            ) : (
                                <Button
                                    label="Login"
                                    icon="pi pi-sign-in"
                                    onClick={() => handleNavClick('/login')}
                                    className={pathname === '/login' ? 'active' : ''}
                                    text
                                    style={{ width: '100%', justifyContent: 'flex-start' }}
                                />
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}

