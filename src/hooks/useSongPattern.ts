import { useEffect, useRef, useCallback } from 'react';
import { usePattern } from '../context/PatternContext';
import { useSpotify } from '../context/SpotifyContext';

interface UseSongPatternProps {
    onIntensityChange: (level: number) => void;
    onMessageTrigger: (message: string) => void;
}

export const useSongPattern = ({ onIntensityChange, onMessageTrigger }: UseSongPatternProps) => {
    const { getPatternForTrack, getDefaultPattern } = usePattern();
    const { currentTrack, position, isPlaying } = useSpotify();

    const lastTrackIdRef = useRef<string | null>(null);
    const appliedEventsRef = useRef<Set<number>>(new Set());
    const currentPatternRef = useRef<{ trackId: string; events: { timestamp: number; type: string; data: unknown }[] } | null>(null);

    // Load pattern when track changes
    useEffect(() => {
        if (!currentTrack) {
            lastTrackIdRef.current = null;
            currentPatternRef.current = null;
            appliedEventsRef.current.clear();
            return;
        }

        if (currentTrack.id !== lastTrackIdRef.current) {
            lastTrackIdRef.current = currentTrack.id;
            appliedEventsRef.current.clear();

            const pattern = getPatternForTrack(currentTrack.id);
            if (pattern) {
                console.log(`Loaded pattern for: ${currentTrack.name} (${pattern.events.length} events)`);
                currentPatternRef.current = { trackId: currentTrack.id, events: pattern.events };
            } else {
                console.log(`Using default pattern for: ${currentTrack.name}`);
                currentPatternRef.current = { trackId: currentTrack.id, events: getDefaultPattern() };
            }
        }
    }, [currentTrack, getPatternForTrack, getDefaultPattern]);

    // Apply events based on playback position
    useEffect(() => {
        if (!isPlaying || !currentPatternRef.current) return;

        const pattern = currentPatternRef.current;

        for (let i = 0; i < pattern.events.length; i++) {
            const event = pattern.events[i];

            // Skip already applied events
            if (appliedEventsRef.current.has(i)) continue;

            // Check if we've passed this event's timestamp (with 500ms tolerance)
            if (position >= event.timestamp && position < event.timestamp + 1000) {
                appliedEventsRef.current.add(i);

                if (event.type === 'intensity') {
                    const data = event.data as { level: number };
                    onIntensityChange(data.level);
                } else if (event.type === 'message') {
                    const data = event.data as { text: string };
                    onMessageTrigger(data.text);
                }
            }
        }
    }, [position, isPlaying, onIntensityChange, onMessageTrigger]);

    // Reset applied events when seeking backward
    const resetAppliedEvents = useCallback(() => {
        appliedEventsRef.current.clear();
    }, []);

    return { resetAppliedEvents };
};
