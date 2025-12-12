'use client'

import { useState, FormEvent, ReactElement, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import api from '@/utils/api'
import { isAuthenticated, isAdmin } from '@/utils/auth'
import { Category } from '@/app/actions'
import FlameDurationSelector from './flameDurationSelector'
import { Card } from 'primereact/card'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputText } from 'primereact/inputtext'
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { toast } from '@/utils/toast'

interface PostFormProps {
    onPostCreated: () => void
}

export default function PostForm({ onPostCreated }: PostFormProps): ReactElement {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isAdminUser, setIsAdminUser] = useState(false)
    const [formData, setFormData] = useState({
        categoryIds: [] as number[],
        contentText: '',
        expirationDuration: '1'
    })
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loading, setLoading] = useState(false)
    const flameSelectorRef = useRef<HTMLDivElement>(null)
    
    // Admin category management state
    const [showAddCategory, setShowAddCategory] = useState(false)
    const [showDeleteCategory, setShowDeleteCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDesc, setNewCategoryDesc] = useState('')
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
    const [savingCategory, setSavingCategory] = useState(false)

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
        setIsAdminUser(isAdmin())
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

    // Admin: Add new category
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Category name required')
            return
        }

        setSavingCategory(true)
        try {
            await api.post('/api/categories', {
                category_name: newCategoryName.trim(),
                description: newCategoryDesc.trim() || null
            })
            toast.success('Category created!')
            setNewCategoryName('')
            setNewCategoryDesc('')
            setShowAddCategory(false)
            fetchCategories()
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                toast.error('Failed to create category', err.response.data.error || 'Unknown error')
            } else {
                toast.error('Failed to create category')
            }
        } finally {
            setSavingCategory(false)
        }
    }

    // Admin: Delete category
    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return

        setSavingCategory(true)
        try {
            await api.delete(`/api/categories/${categoryToDelete}`)
            toast.success('Category deleted!')
            setCategoryToDelete(null)
            setShowDeleteCategory(false)
            // Remove deleted category from form selection
            setFormData(prev => ({
                ...prev,
                categoryIds: prev.categoryIds.filter(id => id !== categoryToDelete)
            }))
            fetchCategories()
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                toast.error('Failed to delete category', err.response.data.error || 'Unknown error')
            } else {
                toast.error('Failed to delete category')
            }
        } finally {
            setSavingCategory(false)
        }
    }

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
                <div className="post-form-row">
                    <div className="post-form-fields">
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label htmlFor="categories" className="p-label" style={{ margin: 0 }}>Categories (optional)</label>
                                {isAdminUser && (
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <Button
                                            type="button"
                                            icon="pi pi-plus"
                                            onClick={() => setShowAddCategory(true)}
                                            className="p-button-text p-button-sm"
                                            tooltip="Add category"
                                            tooltipOptions={{ position: 'top' }}
                                            style={{ padding: '0.25rem 0.5rem' }}
                                        />
                                        <Button
                                            type="button"
                                            icon="pi pi-trash"
                                            onClick={() => setShowDeleteCategory(true)}
                                            className="p-button-text p-button-sm p-button-danger"
                                            tooltip="Delete category"
                                            tooltipOptions={{ position: 'top' }}
                                            style={{ padding: '0.25rem 0.5rem' }}
                                            disabled={categories.length === 0}
                                        />
                                    </div>
                                )}
                            </div>
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

            {/* Admin: Add Category Dialog */}
            <Dialog
                header="Add New Category"
                visible={showAddCategory}
                onHide={() => { setShowAddCategory(false); setNewCategoryName(''); setNewCategoryDesc(''); }}
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="p-field">
                        <label htmlFor="newCatName" className="p-label">Name *</label>
                        <InputText
                            id="newCatName"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Category name"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="newCatDesc" className="p-label">Description</label>
                        <InputTextarea
                            id="newCatDesc"
                            value={newCategoryDesc}
                            onChange={(e) => setNewCategoryDesc(e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <Button
                        label="Create Category"
                        icon="pi pi-check"
                        onClick={handleAddCategory}
                        loading={savingCategory}
                        disabled={!newCategoryName.trim()}
                        style={{ width: '100%' }}
                    />
                </div>
            </Dialog>

            {/* Admin: Delete Category Dialog */}
            <Dialog
                header="Delete Category"
                visible={showDeleteCategory}
                onHide={() => { setShowDeleteCategory(false); setCategoryToDelete(null); }}
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Select a category to delete. Posts will remain but will be unassigned from this category.
                    </p>
                    <div className="p-field">
                        <label htmlFor="deleteCat" className="p-label">Category</label>
                        <MultiSelect
                            id="deleteCat"
                            value={categoryToDelete ? [categoryToDelete] : []}
                            options={categoryOptions}
                            onChange={(e) => setCategoryToDelete(e.value[e.value.length - 1] || null)}
                            placeholder="Select category to delete"
                            selectionLimit={1}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <Button
                        label="Delete Category"
                        icon="pi pi-trash"
                        onClick={handleDeleteCategory}
                        loading={savingCategory}
                        disabled={!categoryToDelete}
                        className="p-button-danger"
                        style={{ width: '100%' }}
                    />
                </div>
            </Dialog>
        </Card>
    )
}