'use client'

import { useState, FormEvent, ReactElement, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import api from '@/utils/api'
import { isAuthenticated } from '@/utils/auth'
import { Category } from '@/app/actions'
import FlameDurationSelector from './flameDurationSelector'
import { Card } from 'primereact/card'
import { InputTextarea } from 'primereact/inputtextarea'
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect'
import { Button } from 'primereact/button'
import { toast } from '@/utils/toast'

interface PostFormProps {
    onPostCreated: () => void
}

export default function PostForm({ onPostCreated }: PostFormProps): ReactElement {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [formData, setFormData] = useState({
        categoryIds: [] as number[],
        contentText: '',
        expirationDuration: '1'
    })
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loading, setLoading] = useState(false)
    const flameSelectorRef = useRef<HTMLDivElement>(null)

    const fetchCategories = useCallback(async () => {
        try {
            setLoadingCategories(true)
            const response = await api.get<Category[]>('/api/categories')
            setCategories(response.data)
        } catch (err) {
            console.error('Error fetching categories:', err)
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
            const textareaElement = document.getElementById('contentText') as HTMLTextAreaElement | null
            if (textareaElement && flameSelectorRef.current) {
                const textareaHeight = textareaElement.offsetHeight
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

    const handleCategoryChange = (e: MultiSelectChangeEvent) => {
        setFormData(prev => ({ ...prev, categoryIds: e.value as number[] }))
    }

    const categoryOptions = categories.map(cat => ({
        label: cat.category_name,
        value: cat.category_id
    }))

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!isAuthenticated()) {
            toast.warn('Please log in to create a post')
            router.push('/login')
            return
        }

        if (!formData.contentText.trim()) {
            toast.error('Post content required', 'Please type out the full content of the post')
            return
        }

        if (!formData.expirationDuration) {
            toast.error('Post duration required', 'Please select a post duration')
            return
        }

        setLoading(true)

        try {
            const endpoint = '/api/posts'

            const payload = {
                content_text: formData.contentText,
                category_ids: formData.categoryIds.length > 0 ? formData.categoryIds : null,
                media_url: null,
                expiration_duration: parseInt(formData.expirationDuration)
            }

            await api.post(endpoint, payload)

            toast.success('Post created successfully!')
            setFormData({ contentText: '', categoryIds: [], expirationDuration: '1' })
            onPostCreated()

        } catch (err: unknown) {
            let errorMessage = 'Post creation failed due to an unknown error.'

            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.details || err.response.data.error || `Server responded with status ${err.response.status}.`
            } else if (err instanceof Error) {
                errorMessage = err.message
            }

            toast.error('Failed to create post', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const header = (
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
            Create new Light
        </h2>
    )

    return (
        <Card header={header} className="post-form-card" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                        <div className="p-field">
                            <label htmlFor="contentText" className="p-label">What&apos;s on your mind?</label>
                            <InputTextarea
                                id="contentText"
                                value={formData.contentText}
                                onChange={(e) => setFormData(prev => ({ ...prev, contentText: e.target.value }))}
                                rows={4}
                                placeholder={isLoggedIn ? "Share your thoughts..." : "Please log in to create a post"}
                                disabled={!isLoggedIn}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="p-field">
                            <label htmlFor="categories" className="p-label">Categories (optional)</label>
                            <MultiSelect
                                id="categories"
                                value={formData.categoryIds}
                                options={categoryOptions}
                                onChange={handleCategoryChange}
                                placeholder="Select categories"
                                disabled={!isLoggedIn || loadingCategories}
                                loading={loadingCategories}
                                display="chip"
                                className="categories-multiselect"
                                style={{ width: '100%' }}
                            />
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

                <Button 
                    type="submit" 
                    label={isLoggedIn ? 'Post' : 'Log in to Post'}
                    icon="pi pi-send"
                    loading={loading}
                    disabled={!isLoggedIn || loading}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                />
            </form>
        </Card>
    )
}