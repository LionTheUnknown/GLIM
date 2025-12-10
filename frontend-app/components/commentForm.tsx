import { useState, ReactElement, FormEvent } from 'react'
import axios from 'axios';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { toast } from '@/utils/toast';

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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!content.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        if (!token) {
            toast.error('Please log in to comment');
            return;
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
            toast.success('Comment posted!');
            onCommentCreated();
            if (onClose) onClose();
            
        } catch (err: unknown) {
            let message = 'Failed to create comment.';
            if (axios.isAxiosError(err) && err.response) {
                message = err.response.data.error || `Server error: ${err.response.status}`;
            }
            toast.error('Failed to create comment', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="comment-form"
        >
            <InputTextarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder={parentCommentId ? "Reply to this comment..." : "Add a comment..."}
                disabled={loading}
                style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                {onClose && (
                    <Button 
                        type="button" 
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={onClose} 
                        outlined
                        size="small"
                    />
                )}
                <Button
                    type="submit"
                    label={loading ? 'Posting...' : 'Submit Comment'}
                    icon="pi pi-send"
                    disabled={loading}
                    loading={loading}
                    size="small"
                />
            </div>
        </form>
    );
}