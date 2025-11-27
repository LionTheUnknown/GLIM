import { useState, ReactElement, FormEvent } from 'react'
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface CommentFormProps {
    postId: number;
    parentCommentId: number | null;
    onCommentCreated: () => void;
    onClose?: () => void;
    token: string | null;
}


export const CommentForm = ({ postId, parentCommentId, onCommentCreated, onClose, token }: CommentFormProps): ReactElement => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!content.trim()) {
            return setError('Comment cannot be empty.');
        }

        if (!token) {
            return setError('You must be logged in to comment.');
        }

        setLoading(true);

        try {
            const endpoint = `${API_BASE_URL}/api/posts/${postId}/comments`;
            await axios.post(endpoint, {
                content_text: content,
                parent_comment_id: parentCommentId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setContent('');
            onCommentCreated();
            if (onClose) onClose();
            
        } catch (err: unknown) {
            let message = 'Failed to create comment.';
            if (axios.isAxiosError(err) && err.response) {
                message = err.response.data.error || `Server error: ${err.response.status}`;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-3 bg-neutral-800 rounded-lg space-y-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder={parentCommentId ? "Reply to this comment..." : "Add a comment..."}
                className="w-full p-2 bg-neutral-700 border border-stone-600 rounded-md text-white"
                disabled={loading}
            />
            <div className="flex justify-end space-x-2">
                {onClose && (
                    <button type="button" onClick={onClose} className="py-1 px-3 text-sm text-stone-300 hover:text-white transition duration-150">
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-md transition duration-150"
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Submit Comment'}
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </form>
    );
}