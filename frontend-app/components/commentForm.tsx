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
        <form 
            onSubmit={handleSubmit} 
            style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: 'rgba(31, 31, 31, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '8px', 
                border: '1px solid rgba(42, 42, 42, 0.5)' 
            }}
        >
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder={parentCommentId ? "Reply to this comment..." : "Add a comment..."}
                className="textarea"
                disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                {onClose && (
                    <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Submit Comment'}
                </button>
            </div>
            {error && <p className="error-message" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{error}</p>}
        </form>
    );
}