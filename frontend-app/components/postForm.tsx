'use client'

import { useState, ChangeEvent, FormEvent, ReactElement, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import api from '@/utils/api'
import { isAuthenticated } from '@/utils/auth'
import { Category } from '@/app/actions'
import FlameDurationSelector from './flameDurationSelector'

interface PostFormProps {
    onPostCreated: () => void
}

export default function PostForm({ onPostCreated }: PostFormProps): ReactElement {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [formData, setFormData] = useState({
        categoryId: '',
        contentText: '',
        expirationDuration: ''
    })
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const flameSelectorRef = useRef<HTMLDivElement>(null)

    const fetchCategories = useCallback(async () => {
        try {
            setLoadingCategories(true)
            const response = await api.get<Category[]>('/api/categories')
            setCategories(response.data)
        } catch (err) {
            console.error('Error fetching categories:', err)
            // Don't show error to user - categories are optional
        } finally {
            setLoadingCategories(false)
        }
    }, [])

    useEffect(() => {
        const authenticated = isAuthenticated()
        setIsLoggedIn(authenticated)
        if (authenticated) {
            fetchCategories()
        }
    }, [fetchCategories])

    useEffect(() => {
        const updateFlameHeight = () => {
            if (textareaRef.current && flameSelectorRef.current) {
                const textareaHeight = textareaRef.current.offsetHeight
                const flameClickable = flameSelectorRef.current.querySelector('.flame-clickable') as HTMLElement
                if (flameClickable) {
                    flameClickable.style.height = `${textareaHeight}px`
                    flameClickable.style.width = `${textareaHeight}px`
                }
            }
        }

        updateFlameHeight()
        window.addEventListener('resize', updateFlameHeight)
        return () => window.removeEventListener('resize', updateFlameHeight)
    }, [])

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)

        if (!isAuthenticated()) {
            router.push('/login')
            return
        }

        if (!formData.contentText.trim()) {
            return setError('Please type out the full content of the post.')
        }

        if (!formData.expirationDuration) {
            return setError('Please select a post duration.')
        }

        try {
            const endpoint = '/api/posts'

            const payload = {
                content_text: formData.contentText,
                category_id: formData.categoryId || null,
                media_url: null,
                expiration_duration: parseInt(formData.expirationDuration)
            }

            await api.post(endpoint, payload)

            setSuccessMessage('Post created successfully!')

            setFormData({ contentText: '', categoryId: '', expirationDuration: '' })

            onPostCreated()

        } catch (err: unknown) {
            let errorMessage = 'Post creation failed due to an unknown error.'

            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.details || err.response.data.error || `Server responded with status ${err.response.status}.`
            } else if (err instanceof Error) {
                errorMessage = err.message
            }

            setError(errorMessage)
        }
    }

    return (
        <div className="card post-form-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Create New Post
                </h2>
                <button
                    onClick={() => router.push('/profile')}
                    className="btn btn-secondary"
                    type="button"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                    My Profile
                </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        <div className="form-group">
                            <label htmlFor="contentText" className="label">What&apos;s on your mind?</label>
                            <textarea
                                ref={textareaRef}
                                id="contentText"
                                name="contentText"
                                value={formData.contentText}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="textarea"
                                placeholder={isLoggedIn ? "Share your thoughts..." : "Please log in to create a post"}
                                disabled={!isLoggedIn}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="categoryId" className="label">Category (optional)</label>
                            <div className="select-wrapper">
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="input"
                                    disabled={!isLoggedIn || loadingCategories}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div ref={flameSelectorRef} className="flame-selector-position">
                        <FlameDurationSelector
                            value={formData.expirationDuration}
                            onChange={(value) => setFormData(prev => ({ ...prev, expirationDuration: value }))}
                            disabled={!isLoggedIn}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    disabled={!isLoggedIn}
                >
                    {isLoggedIn ? 'Post' : 'Log in to Post'}
                </button>
            </form>

            {error && <p className="error-message" style={{ marginTop: '1rem' }}>Error: {error}</p>}
            {successMessage && <p className="success-message" style={{ marginTop: '1rem' }}>{successMessage}</p>}
        </div>
    )
}