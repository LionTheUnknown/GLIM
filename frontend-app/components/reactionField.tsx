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

interface ReactionFieldProps {
    postId: number; 
    initialCounts: ReactionCounts;
    initialUserReaction: UserReactionStatus;
}

export default function ReactionField({ postId, initialCounts, initialUserReaction }: ReactionFieldProps) {
    const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
    const [userReaction, setUserReaction] = useState<UserReactionStatus>(initialUserReaction);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCounts(initialCounts);
        setUserReaction(initialUserReaction);
    }, [initialCounts.like_count, initialCounts.dislike_count, initialUserReaction]);

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
            const response = await axios.post(
                `${API_BASE_URL}/api/posts/${postId}/reactions`,
                { reaction_type: type },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (response.data.reaction_counts && response.data.user_reaction_type !== undefined) {
                setCounts(response.data.reaction_counts);
                setUserReaction(response.data.user_reaction_type);
            }
            
        } catch (error) {
            console.error("Error toggling reaction:", error);
            toast.error('Failed to update reaction', 'Please try again');
            setCounts(initialCounts);
            setUserReaction(initialUserReaction);
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