'use client'

import { useState, useEffect, ReactElement, useMemo } from 'react';
import fireAnimation from '@/Fire (Remix).json';

interface FlameTimerProps {
    expiresAt: string | null;
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

export default function FlameTimer({ expiresAt }: FlameTimerProps): ReactElement {
    const frames = useMemo(() => fireAnimation.frames as AnimationFrame[], []);
    
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

    const getFlameRange = (minutes: number) => {
        if (minutes <= 0) return null;
        for (const range of DURATION_RANGES) {
            if (minutes <= range.maxMinutes) {
                return range;
            }
        }
        return DURATION_RANGES[DURATION_RANGES.length - 1];
    };

    useEffect(() => {
        if (!expiresAt) {
            setIsExpired(false);
            setTimeRemaining(0);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiration = new Date(expiresAt).getTime();
            const difference = expiration - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeRemaining(0);
                return;
            }

            setIsExpired(false);
            const minutesRemaining = Math.floor(difference / (1000 * 60));
            setTimeRemaining(minutesRemaining);
        };

        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    useEffect(() => {
        if (isExpired || !expiresAt || !frames.length) return;

        const flameRange = getFlameRange(timeRemaining);
        if (!flameRange) return;

        const frameRange = flameRange.frameEnd - flameRange.frameStart + 1;
        
        setCurrentFrameIndex(flameRange.frameStart);

        const interval = setInterval(() => {
            setCurrentFrameIndex(prev => {
                const currentRange = getFlameRange(timeRemaining);
                if (!currentRange || prev < currentRange.frameStart || prev > currentRange.frameEnd) {
                    return currentRange.frameStart;
                }
                const relativeIndex = prev - currentRange.frameStart;
                const nextRelativeIndex = (relativeIndex + 1) % frameRange;
                return currentRange.frameStart + nextRelativeIndex;
            });
        }, FRAME_DURATION_MS);

        return () => clearInterval(interval);
    }, [isExpired, expiresAt, timeRemaining, frames.length]);

    if (!expiresAt) {
        return <></>;
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

    const flameRange = getFlameRange(timeRemaining);
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
        } else {
            return `${minutes}m`;
        }
    };

    const validFrameIndex = Math.max(0, Math.min(currentFrameIndex, frames.length - 1));
    const currentFrame = frames[validFrameIndex];
    const currentFlame = currentFrame?.content || currentFrame?.contentString?.split('\n') || [];

    return (
        <div className="flame-timer">
            <div className="flame-timer-flame">
                {currentFlame.length > 0 ? (
                    <pre 
                        className="flame-timer-ascii"
                        style={{ 
                            color: getFlameColor(),
                            textShadow: `0 0 8px ${getFlameColor()}, 0 0 16px ${getFlameColor()}`,
                            filter: `drop-shadow(0 0 6px ${getFlameColor()})`,
                        }}
                    >
                        {currentFlame.join('\n')}
                    </pre>
                ) : null}
            </div>
            <span className="flame-timer-label">{formatTime()}</span>
        </div>
    );
}

