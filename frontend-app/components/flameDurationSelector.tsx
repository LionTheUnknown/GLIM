'use client'

import { useState, useEffect, ReactElement, useMemo } from 'react';
import fireAnimation from '@/Fire (Remix).json';

interface FlameDurationSelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

interface AnimationFrame {
    title: string;
    duration: number;
    content: string[];
    contentString: string;
}

const DURATION_OPTIONS = [
    { value: '1', label: '1 minute', frameStart: 0, frameEnd: 31 },
    { value: '60', label: '1 hour', frameStart: 32, frameEnd: 63 },
    { value: '1440', label: '1 day', frameStart: 64, frameEnd: 94 },
];

const FRAME_RATE = 12;
const FRAME_DURATION_MS = 1000 / FRAME_RATE;

export default function FlameDurationSelector({ value, onChange, disabled }: FlameDurationSelectorProps): ReactElement {
    const frames = useMemo(() => fireAnimation.frames as AnimationFrame[], []);
    
    const getInitialState = () => {
        const index = DURATION_OPTIONS.findIndex(opt => opt.value === value);
        const selectedIdx = index >= 0 ? index : 0;
        return {
            selectedIndex: selectedIdx,
            currentFrameIndex: DURATION_OPTIONS[selectedIdx].frameStart
        };
    };

    const [currentFrameIndex, setCurrentFrameIndex] = useState(() => getInitialState().currentFrameIndex);
    const [selectedIndex, setSelectedIndex] = useState(() => getInitialState().selectedIndex);

    useEffect(() => {
        const index = DURATION_OPTIONS.findIndex(opt => opt.value === value);
        if (index >= 0 && index !== selectedIndex) {
            setSelectedIndex(index);
            const newFrameStart = DURATION_OPTIONS[index].frameStart;
            setCurrentFrameIndex(newFrameStart);
        }
    }, [value, selectedIndex]);

    useEffect(() => {
        if (disabled || !frames.length) return;
        
        const selectedOption = DURATION_OPTIONS[selectedIndex];
        const frameRange = selectedOption.frameEnd - selectedOption.frameStart + 1;
        
        setCurrentFrameIndex(selectedOption.frameStart);
        
        const interval = setInterval(() => {
            setCurrentFrameIndex(prev => {
                if (prev < selectedOption.frameStart || prev > selectedOption.frameEnd) {
                    return selectedOption.frameStart;
                }
                const relativeIndex = prev - selectedOption.frameStart;
                const nextRelativeIndex = (relativeIndex + 1) % frameRange;
                return selectedOption.frameStart + nextRelativeIndex;
            });
        }, FRAME_DURATION_MS);

        return () => clearInterval(interval);
    }, [disabled, selectedIndex, frames.length]);

    const validFrameIndex = Math.max(0, Math.min(currentFrameIndex, frames.length - 1));
    const currentFrame = frames[validFrameIndex];
    const currentFlame = currentFrame?.content || currentFrame?.contentString?.split('\n') || [];

    const handleFlameClick = () => {
        if (disabled) return;
        const nextIndex = (selectedIndex + 1) % DURATION_OPTIONS.length;
        const nextOption = DURATION_OPTIONS[nextIndex];
        setSelectedIndex(nextIndex);
        setCurrentFrameIndex(nextOption.frameStart);
        onChange(nextOption.value);
    };

    const getFlameColor = (index: number) => {
        if (index === 0) return '#ff6b35';
        if (index === 1) return '#ff8c42';
        return '#ffd23f';
    };

    return (
        <div className="flame-duration-selector">
            <div 
                className="flame-display flame-clickable"
                onClick={handleFlameClick}
                title={`Click to change duration (${DURATION_OPTIONS[selectedIndex].label})`}
            >
                {currentFlame.length > 0 ? (
                    <pre 
                        className="flame-ascii"
                        style={{ 
                            color: getFlameColor(selectedIndex),
                            textShadow: `0 0 10px ${getFlameColor(selectedIndex)}, 0 0 20px ${getFlameColor(selectedIndex)}`,
                            filter: `drop-shadow(0 0 8px ${getFlameColor(selectedIndex)})`,
                        }}
                    >
                        {currentFlame.join('\n')}
                    </pre>
                ) : (
                    <div className="flame-loading">Loading...</div>
                )}
                <div className="flame-label">
                    {DURATION_OPTIONS[selectedIndex].label}
                    <span className="flame-click-hint">(Click to change)</span>
                </div>
            </div>
        </div>
    );
}

