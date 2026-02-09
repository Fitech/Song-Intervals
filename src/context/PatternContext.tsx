import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
interface IntensityEvent {
    level: number;
}

interface MessageEvent {
    text: string;
    key: string;
}

interface PatternEvent {
    timestamp: number; // Time from song start (ms)
    type: 'intensity' | 'message';
    data: IntensityEvent | MessageEvent;
}

interface SongPattern {
    trackId: string;
    trackName: string;
    artistName: string;
    duration: number;
    events: PatternEvent[];
    recordedAt: number;
    playCount: number;
}

interface PatternLibrary {
    version: string;
    songs: Record<string, SongPattern>;
    defaultPattern: PatternEvent[];
}

interface PatternContextType {
    isRecording: boolean;
    patternLibrary: PatternLibrary;
    currentSongPattern: SongPattern | null;
    startRecording: (trackId: string, trackName: string, artistName: string, duration: number) => void;
    stopRecording: () => void;
    saveAndStartNew: (trackId: string, trackName: string, artistName: string, duration: number) => void;
    recordEvent: (event: PatternEvent) => void;
    getPatternForTrack: (trackId: string) => SongPattern | null;
    getDefaultPattern: () => PatternEvent[];
    exportLibrary: () => void;
    importLibrary: (json: string) => boolean;
    deletePattern: (trackId: string) => void;
    isModalOpen: boolean;
    setModalOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'workout_pattern_library';

const defaultLibrary: PatternLibrary = {
    version: '1.0',
    songs: {},
    defaultPattern: [
        { timestamp: 0, type: 'intensity', data: { level: 5 } },
        { timestamp: 60000, type: 'intensity', data: { level: 7 } },
        { timestamp: 120000, type: 'intensity', data: { level: 3 } },
    ]
};

const PatternContext = createContext<PatternContextType | null>(null);

export const usePattern = () => {
    const context = useContext(PatternContext);
    if (!context) {
        throw new Error('usePattern must be used within PatternProvider');
    }
    return context;
};

interface PatternProviderProps {
    children: ReactNode;
}

export const PatternProvider: React.FC<PatternProviderProps> = ({ children }) => {
    const [patternLibrary, setPatternLibrary] = useState<PatternLibrary>(() => {
        // Load from localStorage on init
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load pattern library:', e);
        }
        return defaultLibrary;
    });

    const [isRecording, setIsRecording] = useState(false);
    const [currentSongPattern, setCurrentSongPattern] = useState<SongPattern | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);

    // Save to localStorage whenever library changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(patternLibrary));
        } catch (e) {
            console.error('Failed to save pattern library:', e);
        }
    }, [patternLibrary]);

    const startRecording = useCallback((trackId: string, trackName: string, artistName: string, duration: number) => {
        setIsRecording(true);
        setCurrentSongPattern({
            trackId,
            trackName,
            artistName,
            duration,
            events: [],
            recordedAt: Date.now(),
            playCount: 0
        });
        console.log(`Started recording: ${trackName}`);
    }, []);

    const stopRecording = useCallback(() => {
        if (currentSongPattern && currentSongPattern.events.length > 0) {
            setPatternLibrary(prev => ({
                ...prev,
                songs: {
                    ...prev.songs,
                    [currentSongPattern.trackId]: currentSongPattern
                }
            }));
            console.log(`Saved pattern for: ${currentSongPattern.trackName} (${currentSongPattern.events.length} events)`);
        }
        setIsRecording(false);
        setCurrentSongPattern(null);
    }, [currentSongPattern]);

    // Save current pattern and start recording a new track (for track changes)
    const saveAndStartNew = useCallback((trackId: string, trackName: string, artistName: string, duration: number) => {
        // Save current pattern if it has events
        if (currentSongPattern && currentSongPattern.events.length > 0) {
            setPatternLibrary(prev => ({
                ...prev,
                songs: {
                    ...prev.songs,
                    [currentSongPattern.trackId]: currentSongPattern
                }
            }));
            console.log(`Auto-saved pattern for: ${currentSongPattern.trackName} (${currentSongPattern.events.length} events)`);
        }

        // Start new recording for new track
        setCurrentSongPattern({
            trackId,
            trackName,
            artistName,
            duration,
            events: [],
            recordedAt: Date.now(),
            playCount: 0
        });
        console.log(`Started recording new track: ${trackName}`);
    }, [currentSongPattern]);

    const recordEvent = useCallback((event: PatternEvent) => {
        if (!isRecording || !currentSongPattern) return;

        setCurrentSongPattern(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                events: [...prev.events, event]
            };
        });
    }, [isRecording, currentSongPattern]);

    const getPatternForTrack = useCallback((trackId: string): SongPattern | null => {
        return patternLibrary.songs[trackId] || null;
    }, [patternLibrary]);

    const getDefaultPattern = useCallback((): PatternEvent[] => {
        return patternLibrary.defaultPattern;
    }, [patternLibrary]);

    const exportLibrary = useCallback(() => {
        const json = JSON.stringify(patternLibrary, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout_patterns_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [patternLibrary]);

    const importLibrary = useCallback((json: string): boolean => {
        try {
            const imported = JSON.parse(json) as PatternLibrary;
            if (imported.version && imported.songs) {
                setPatternLibrary(imported);
                return true;
            }
        } catch (e) {
            console.error('Failed to import library:', e);
        }
        return false;
    }, []);

    const deletePattern = useCallback((trackId: string) => {
        setPatternLibrary(prev => {
            const { [trackId]: _, ...rest } = prev.songs;
            return { ...prev, songs: rest };
        });
    }, []);

    return (
        <PatternContext.Provider
            value={{
                isRecording,
                patternLibrary,
                currentSongPattern,
                startRecording,
                stopRecording,
                saveAndStartNew,
                recordEvent,
                getPatternForTrack,
                getDefaultPattern,
                exportLibrary,
                importLibrary,
                deletePattern,
                isModalOpen,
                setModalOpen
            }}
        >
            {children}
        </PatternContext.Provider>
    );
};
