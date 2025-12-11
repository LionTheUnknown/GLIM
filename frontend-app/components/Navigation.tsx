'use client'

import { ReactElement, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from 'primereact/button'
import { isAuthenticated, getUserRole } from '@/utils/auth'
import { isDevMode, toggleDevMode } from '@/utils/devMode'
import './Navigation.css'

export default function Navigation(): ReactElement {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [devMode, setDevMode] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        setDevMode(isDevMode())
        setUserRole(getUserRole())
        
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false)
            }
        }
        
        handleResize()
        window.addEventListener('resize', handleResize)
        
        const handleDevModeChange = (e: CustomEvent) => {
            setDevMode(e.detail)
        }
        
        window.addEventListener('devModeChanged', handleDevModeChange as EventListener)
        
        // Check role periodically in case token changes
        const roleCheckInterval = setInterval(() => {
            setUserRole(getUserRole())
        }, 5000)
        
        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('devModeChanged', handleDevModeChange as EventListener)
            clearInterval(roleCheckInterval)
        }
    }, [])

    const loggedIn = isAuthenticated()
    const isDev = userRole === 'admin' || userRole === 'developer'

    const handleDevModeToggle = () => {
        const newState = toggleDevMode()
        setDevMode(newState)
    }

    const handleNavClick = (path: string) => {
        router.push(path)
        setIsMobileMenuOpen(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        if (devMode) {
            toggleDevMode() // Disable dev mode on logout
        }
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
                            {isDev && (
                                <>
                                    <div className="mobile-menu-divider"></div>
                                    <Button
                                        label={devMode ? 'Switch to User View' : 'Switch to Dev View'}
                                        icon={devMode ? 'pi pi-user' : 'pi pi-cog'}
                                        onClick={handleDevModeToggle}
                                        className={devMode ? 'dev-mode-active' : ''}
                                        text
                                        style={{ width: '100%', justifyContent: 'flex-start' }}
                                    />
                                    {devMode && (
                                        <div className="dev-mode-badge-mobile">
                                            DEV VIEW ACTIVE
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}

