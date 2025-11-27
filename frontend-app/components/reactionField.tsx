import { useState } from 'react';
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
    const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
    const [userReaction, setUserReaction] = useState<UserReactionStatus>(initialUserReaction);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setCounts(optimisticCounts);
        setUserReaction(newReaction);
        
        try {
            await axios.post(
                `${API_BASE_URL}/api/posts/${postId}/reactions`,
                { reaction_type: type },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

        } catch (error) {
            console.error("Error toggling reaction:", error);
            alert('Failed to update reaction. Please try again.');
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