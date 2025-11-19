'use client'

import { useState, ChangeEvent, FormEvent, ReactElement } from 'react'
import axios from 'axios'
import api from '@/utils/api'

interface PostFormProps {
    onPostCreated: () => void
}

export default function PostForm({ onPostCreated }: PostFormProps): ReactElement {
    const [formData, setFormData] = useState({
        categoryId: '',
        contentText: '',
        mediaUrl: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)

        if (!formData.contentText.trim()) {
            return setError('Please type out the full content of the post.')
        }

        try {
            const endpoint = '/posts/createPost'

            const payload = {
                content_text: formData.contentText,
                category_id: formData.categoryId || null,
                media_url: formData.mediaUrl || null
            }

            await api.post(endpoint, payload)

            setSuccessMessage('Post created successfully!')

            setFormData({ contentText: '', categoryId: '', mediaUrl: '' })

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
        <div className="border border-stone-600 rounded-lg p-4 mb-8 bg-neutral-900 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Create New Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-white">
                    <label htmlFor="contentText" className="block text-sm font-medium mb-1">Content Text (required):</label>
                    <textarea
                        id="contentText"
                        name="contentText"
                        value={formData.contentText}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full p-2 bg-neutral-800 border border-stone-700 rounded-md focus:border-indigo-500 text-white"
                        placeholder="What's on your mind? (Use Enter for new lines)"
                    />
                </div>

                <div className="text-white">
                    <label htmlFor="categoryId" className="block text-sm font-medium mb-1">Category ID (Optional):</label>
                    <input
                        type="text"
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        className="w-full p-2 bg-neutral-800 border border-stone-700 rounded-md focus:border-indigo-500 text-white"
                        placeholder="e.g., 1 or leave blank"
                    />
                </div>

                <div className="text-white">
                    <label htmlFor="mediaUrl" className="block text-sm font-medium mb-1">Media URL (Optional):</label>
                    <input
                        type="text"
                        id="mediaUrl"
                        name="mediaUrl"
                        value={formData.mediaUrl}
                        onChange={handleChange}
                        className="w-full p-2 bg-neutral-800 border border-stone-700 rounded-md focus:border-indigo-500 text-white"
                        placeholder="URL to an image or video"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition duration-150"
                >
                    Post
                </button>
            </form>

            {error && <p className="mt-3 text-red-400 text-sm">Error: {error}</p>}
            {successMessage && <p className="mt-3 text-green-400 text-sm">{successMessage}</p>}
        </div>
    )
}