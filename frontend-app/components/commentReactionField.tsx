import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from '@/utils/toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const getToken = () => localStorage.getItem('token');

type ReactionType = 'like' | 'dislike';
type UserReactionStatus = ReactionType | null;

interface ReactionCounts {
    like_count: number;
    dislike_count: number;
}

interface CommentReactionFieldProps {
    postId: number;
    commentId: number;
    initialCounts: ReactionCounts;
    initialUserReaction: UserReactionStatus;
}

export default function CommentReactionField({ postId, commentId, initialCounts, initialUserReaction }: CommentReactionFieldProps) {
    const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
    const [userReaction, setUserReaction] = useState<UserReactionStatus>(initialUserReaction);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCounts(initialCounts);
        setUserReaction(initialUserReaction);
    }, [initialCounts, initialUserReaction]);

    const handleReaction = async (type: ReactionType) => {
        if (isSubmitting) return;
        
        if (!getToken()) {
            toast.error('Please log in to react');
            return;
        }

        setIsSubmitting(true);
        
        const isCurrentlyReacted = userReaction === type;
        const newReaction: UserReactionStatus = isCurrentlyReacted ? null : type;
        const newCounts = { ...counts };

        if (userReaction !== null) {
            newCounts[`${userReaction}_count` as keyof ReactionCounts] = Math.max(0, newCounts[`${userReaction}_count` as keyof ReactionCounts] - 1);
        }

        if (newReaction !== null) {
            newCounts[`${newReaction}_count` as keyof ReactionCounts] = newCounts[`${newReaction}_count` as keyof ReactionCounts] + 1;
        }

        setCounts(newCounts);
        setUserReaction(newReaction);
        
        try {
            await axios.post(
                `${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/reactions`,
                { reaction_type: type },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            const countsResponse = await axios.get(
                `${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/reactions`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (countsResponse.data) {
                setCounts(countsResponse.data);
            }

            try {
                const userReactionResponse = await axios.get(
                    `${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/reactions/me`,
                    { headers: { Authorization: `Bearer ${getToken()}` } }
                );
                if (userReactionResponse.data?.user_reaction_type) {
                    setUserReaction(userReactionResponse.data.user_reaction_type);
                } else {
                    setUserReaction(null);
                }
            } catch (_err) {
                setUserReaction(null);
            }
            
        } catch (error) {
            console.error("Error toggling comment reaction:", error);
            toast.error('Failed to update reaction', 'Please try again');
            setCounts(initialCounts);
            setUserReaction(initialUserReaction);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="comment-reaction-field">
            <button 
                onClick={() => handleReaction('like')}
                className={`reaction-btn ${userReaction === 'like' ? 'reaction-btn-active' : 'reaction-btn-inactive'}`}
                disabled={isSubmitting}
            >
                <ThumbsUp size={14} fill={userReaction === 'like' ? 'white' : 'none'} />
                <span>{counts.like_count}</span>
            </button>

            <button 
                onClick={() => handleReaction('dislike')}
                className={`reaction-btn ${userReaction === 'dislike' ? 'reaction-btn-active' : 'reaction-btn-inactive'}`}
                disabled={isSubmitting}
            >
                <ThumbsDown size={14} fill={userReaction === 'dislike' ? 'white' : 'none'} />
                <span>{counts.dislike_count}</span>
            </button>
        </div>
    );
}

