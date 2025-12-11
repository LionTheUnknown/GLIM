'use client'

import { useState, useEffect, ReactElement, useMemo, useRef } from 'react';
import fireAnimation from '@/Fire (Remix).json';
import api from '@/utils/api';
import { toast } from '@/utils/toast';
import { isAuthenticated } from '@/utils/auth';

interface FlameTimerProps {
    expiresAt: string | null;
    postId?: number;
    onExpirationUpdate?: (newExpiresAt: string) => void;
    userReaction?: 'like' | 'dislike' | null;
}

interface AnimationFrame {
    title: string;
    duration: number;
    content: string[];
    contentString: string;
}

const DURATION_RANGES = [
    { frameStart: 0, frameEnd: 31, maxMinutes: 60 },
    { frameStart: 32, frameEnd: 63, maxMinutes: 1440 },
    { frameStart: 64, frameEnd: 94, maxMinutes: Infinity },
];

const FRAME_RATE = 12;
const FRAME_DURATION_MS = 1000 / FRAME_RATE;

export default function FlameTimer({ expiresAt, postId, onExpirationUpdate, userReaction }: FlameTimerProps): ReactElement {
    const frames = useMemo(() => fireAnimation.frames as AnimationFrame[], []);
    
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
    const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(expiresAt);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const flameRef = useRef<HTMLDivElement>(null);

    const getFlameRange = (minutes: number, hasSeconds: boolean = false) => {
        if (minutes === 0 && hasSeconds) {
            return DURATION_RANGES[0];
        }
        if (minutes <= 0) return null;
        for (const range of DURATION_RANGES) {
            if (minutes <= range.maxMinutes) {
                return range;
            }
        }
        return DURATION_RANGES[DURATION_RANGES.length - 1];
    };

    useEffect(() => {
        setCurrentExpiresAt(expiresAt);
    }, [expiresAt]);

    useEffect(() => {
        if (!currentExpiresAt) {
            setIsExpired(false);
            setTimeRemaining(0);
            setSecondsRemaining(0);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiration = new Date(currentExpiresAt).getTime();
            const difference = expiration - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeRemaining(0);
                setSecondsRemaining(0);
                return;
            }

            setIsExpired(false);
            const totalSeconds = Math.floor(difference / 1000);
            const minutesRemaining = Math.floor(totalSeconds / 60);
            const secondsRemaining = totalSeconds % 60;
            setTimeRemaining(minutesRemaining);
            setSecondsRemaining(secondsRemaining);
        };

        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [currentExpiresAt]);

    useEffect(() => {
        if (isExpired || !currentExpiresAt || !frames.length) return;

        const hasSeconds = secondsRemaining > 0;
        const flameRange = getFlameRange(timeRemaining, hasSeconds);
        if (!flameRange) {
            const fallbackRange = DURATION_RANGES[0];
            setCurrentFrameIndex(fallbackRange.frameStart);
            return;
        }
        
        setCurrentFrameIndex(flameRange.frameStart);

        const interval = setInterval(() => {
            setCurrentFrameIndex(prev => {
                const currentHasSeconds = secondsRemaining > 0;
                const currentRange = getFlameRange(timeRemaining, currentHasSeconds);
                
                if (!currentRange) {
                    const fallbackRange = DURATION_RANGES[0];
                    return fallbackRange.frameStart;
                }
                
                if (prev < currentRange.frameStart || prev > currentRange.frameEnd) {
                    return currentRange.frameStart;
                }
                
                const relativeIndex = prev - currentRange.frameStart;
                const nextRelativeIndex = (relativeIndex + 1) % (currentRange.frameEnd - currentRange.frameStart + 1);
                return currentRange.frameStart + nextRelativeIndex;
            });
        }, FRAME_DURATION_MS);

        return () => clearInterval(interval);
    }, [isExpired, currentExpiresAt, timeRemaining, secondsRemaining, frames.length]);

    const handleFlameClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!postId || isSubmitting || !isAuthenticated()) {
            if (!isAuthenticated()) {
                toast.error('Please log in to react');
            }
            return;
        }

        if (!flameRef.current) return;

        const rect = flameRef.current.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const height = rect.height;
        const isTopHalf = clickY < height / 2;

        const reactionType = isTopHalf ? 'like' : 'dislike';
        setIsSubmitting(true);

        try {
            const response = await api.post(
                `/api/posts/${postId}/reactions`,
                { reaction_type: reactionType }
            );

            if (response.data.expires_at) {
                setCurrentExpiresAt(response.data.expires_at);
                if (onExpirationUpdate) {
                    onExpirationUpdate(response.data.expires_at);
                }
            } else {
                const postResponse = await api.get(`/api/posts/${postId}`);
                if (postResponse.data.expires_at) {
                    setCurrentExpiresAt(postResponse.data.expires_at);
                    if (onExpirationUpdate) {
                        onExpirationUpdate(postResponse.data.expires_at);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
            toast.error('Failed to update reaction', 'Please try again');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentExpiresAt) {
        return (
            <div className="flame-timer expired">
                <div className="flame-timer-flame">
                    <pre className="flame-timer-ascii" style={{ color: '#666', opacity: 0.3 }}>
                        {frames[0]?.content?.join('\n') || ''}
                    </pre>
                </div>
                <span className="flame-timer-label">No Timer</span>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="flame-timer expired">
                <div className="flame-timer-flame">
                    <pre className="flame-timer-ascii" style={{ color: '#666', opacity: 0.3 }}>
                        {frames[0]?.content?.join('\n') || ''}
                    </pre>
                </div>
                <span className="flame-timer-label">Expired</span>
            </div>
        );
    }

    const hasSeconds = secondsRemaining > 0;
    const flameRange = getFlameRange(timeRemaining, hasSeconds);
    if (!flameRange) return <></>;

    const getFlameColor = () => {
        if (timeRemaining <= 60) return '#ff6b35';
        if (timeRemaining <= 1440) return '#ff8c42';
        return '#ffd23f';
    };

    const formatTime = () => {
        const days = Math.floor(timeRemaining / 1440);
        const hours = Math.floor((timeRemaining % 1440) / 60);
        const minutes = timeRemaining % 60;

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${secondsRemaining}s`;
        }
    };

    const validFrameIndex = Math.max(0, Math.min(currentFrameIndex, frames.length - 1));
    const currentFrame = frames[validFrameIndex];
    const currentFlame = currentFrame?.content || currentFrame?.contentString?.split('\n') || [];

    const getBorderColor = () => {
        if (!userReaction) return 'rgba(42, 42, 42, 0.5)';
        return userReaction === 'like' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    };

    return (
        <div className="flame-timer">
            <div 
                ref={flameRef}
                className="flame-timer-flame"
                onClick={handleFlameClick}
                style={{ 
                    cursor: postId && isAuthenticated() ? 'pointer' : 'default',
                    opacity: isSubmitting ? 0.7 : 1,
                    position: 'relative',
                    borderColor: getBorderColor(),
                    transition: 'border-color 0.2s'
                }}
            >
                {currentFlame.length > 0 ? (
                    <pre 
                        className="flame-timer-ascii"
                        style={{ 
                            color: getFlameColor(),
                            pointerEvents: 'none'
                        }}
                    >
                        {currentFlame.join('\n')}
                    </pre>
                ) : null}
                {postId && isAuthenticated() && (
                    <>
                        <div 
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                backgroundColor: userReaction === 'like' ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                                borderTopLeftRadius: '50%',
                                borderTopRightRadius: '50%',
                                pointerEvents: 'none',
                                transition: 'background-color 0.2s'
                            }}
                        />
                        <div 
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                backgroundColor: userReaction === 'dislike' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                                borderBottomLeftRadius: '50%',
                                borderBottomRightRadius: '50%',
                                pointerEvents: 'none',
                                transition: 'background-color 0.2s'
                            }}
                        />
                    </>
                )}
            </div>
            <span className="flame-timer-label">{formatTime()}</span>
        </div>
    );
}

