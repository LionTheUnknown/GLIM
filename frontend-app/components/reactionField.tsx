import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThumbsUp, ThumbsDown } from 'lucide-react'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const getToken = () => localStorage.getItem('token');

type ReactionType = 'like' | 'dislike';
type UserReactionStatus = ReactionType | null;

interface ReactionCounts {
    like_count: number;
    dislike_count: number;
}

interface ReactionFieldProps {
    postId: number; 
    initialCounts: ReactionCounts;
    initialUserReaction: UserReactionStatus;
}

export default function ReactionField({ postId, initialCounts, initialUserReaction }: ReactionFieldProps) {
    // Use props as source of truth, with optimistic updates during submission
    const [optimisticCounts, setOptimisticCounts] = useState<ReactionCounts | null>(null);
    const [optimisticReaction, setOptimisticReaction] = useState<UserReactionStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use optimistic values if available, otherwise use props from backend
    const counts = optimisticCounts ?? initialCounts;
    const userReaction = optimisticReaction !== null ? optimisticReaction : initialUserReaction;

    // Reset optimistic state when props change (e.g., navigating back with fresh data)
    useEffect(() => {
        if (!isSubmitting) {
            setOptimisticCounts(null);
            setOptimisticReaction(null);
        }
    }, [initialCounts.like_count, initialCounts.dislike_count, initialUserReaction, isSubmitting]);

    const handleReaction = async (type: ReactionType) => {
        if (isSubmitting || !getToken()) return alert('Please log in to react.');

        setIsSubmitting(true);
        
        const isCurrentlyReacted = userReaction === type;
        const newReaction: UserReactionStatus = isCurrentlyReacted ? null : type;
        const optimisticCounts = { ...counts };

        if (userReaction !== null) {
            optimisticCounts[`${userReaction}_count` as keyof ReactionCounts] = Math.max(0, optimisticCounts[`${userReaction}_count` as keyof ReactionCounts] - 1);
        }

        if (newReaction !== null) {
            optimisticCounts[`${newReaction}_count` as keyof ReactionCounts] = optimisticCounts[`${newReaction}_count` as keyof ReactionCounts] + 1;
        }

        // Set optimistic state for immediate UI feedback
        setOptimisticCounts(optimisticCounts);
        setOptimisticReaction(newReaction);
        
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/posts/${postId}/reactions`,
                { reaction_type: type },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            // Use the updated state from backend response
            if (response.data.reaction_counts && response.data.user_reaction_type !== undefined) {
                setOptimisticCounts(response.data.reaction_counts);
                setOptimisticReaction(response.data.user_reaction_type);
            }
            
        } catch (error) {
            console.error("Error toggling reaction:", error);
            alert('Failed to update reaction. Please try again.');
            // Revert to props from backend on error
            setOptimisticCounts(null);
            setOptimisticReaction(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reaction-field">
            <button 
                onClick={() => handleReaction('like')}
                className={`reaction-btn ${userReaction === 'like' ? 'reaction-btn-active' : 'reaction-btn-inactive'}`}
                disabled={isSubmitting}
            >
                <ThumbsUp size={16} fill={userReaction === 'like' ? 'white' : 'none'} />
                <span>{counts.like_count}</span>
            </button>

            <button 
                onClick={() => handleReaction('dislike')}
                className={`reaction-btn ${userReaction === 'dislike' ? 'reaction-btn-active' : 'reaction-btn-inactive'}`}
                disabled={isSubmitting}
            >
                <ThumbsDown size={16} fill={userReaction === 'dislike' ? 'white' : 'none'} />
                <span>{counts.dislike_count}</span>
            </button>
        </div>
    );
}