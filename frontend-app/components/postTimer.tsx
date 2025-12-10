'use client'

import { useState, useEffect, ReactElement } from 'react';
import { Clock } from 'lucide-react';

interface PostTimerProps {
    expiresAt: string | null;
}

export default function PostTimer({ expiresAt }: PostTimerProps): ReactElement {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState<boolean>(false);

    useEffect(() => {
        if (!expiresAt) {
            setTimeRemaining('No expiration');
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiration = new Date(expiresAt).getTime();
            const difference = expiration - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeRemaining('Expired');
                return;
            }

            setIsExpired(false);

            // Calculate time units
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Format time remaining
            let formatted = '';
            if (days > 0) {
                formatted = `${days}d ${hours}h`;
            } else if (hours > 0) {
                formatted = `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                formatted = `${minutes}m ${seconds}s`;
            } else {
                formatted = `${seconds}s`;
            }

            setTimeRemaining(formatted);
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt) {
        return <></>;
    }

    return (
        <div className={`post-timer ${isExpired ? 'post-timer-expired' : ''}`}>
            <Clock size={14} />
            <span>{isExpired ? 'Expired' : timeRemaining}</span>
        </div>
    );
}

