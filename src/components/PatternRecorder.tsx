import React, { useRef } from 'react';
import { usePattern } from '../context/PatternContext';
import { useSpotify } from '../context/SpotifyContext';

export const PatternRecorder: React.FC = () => {
    const {
        isRecording,
        isModalOpen,
        setModalOpen,
        patternLibrary,
        exportLibrary,
        importLibrary,
        deletePattern,
        stopRecording
    } = usePattern();

    const { currentTrack, position, duration } = useSpotify();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target?.result as string;
            if (importLibrary(json)) {
                alert('Library imported successfully!');
            } else {
                alert('Failed to import library. Invalid format.');
            }
        };
        reader.readAsText(file);
    };

    const songCount = Object.keys(patternLibrary.songs).length;

    return (
        <>
            {/* Indicator Dot */}
            <button
                onClick={() => setModalOpen(!isModalOpen)}
                className="pattern-indicator"
                title={isRecording ? 'Recording... (click to manage)' : 'Pattern Manager'}
                style={{
                    background: isRecording ? 'rgba(239, 68, 68, 0.7)' : 'rgba(100, 100, 100, 0.4)',
                    boxShadow: isRecording ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none'
                }}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="pattern-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="pattern-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pattern-modal-header">
                            <h3>Pattern Manager</h3>
                            <button onClick={() => setModalOpen(false)} className="pattern-modal-close">×</button>
                        </div>

                        {/* Current Status */}
                        <div className="pattern-status">
                            {isRecording ? (
                                <>
                                    <span className="pattern-status-dot pattern-status-dot--recording" />
                                    <span>Recording: {currentTrack?.name || 'Unknown'}</span>
                                    <span className="pattern-status-time">
                                        {formatTime(position)} / {formatTime(duration)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="pattern-status-dot" />
                                    <span>Ready to record</span>
                                </>
                            )}
                        </div>

                        <p className="pattern-hint">Press 'R' to {isRecording ? 'stop' : 'start'} recording</p>

                        {isRecording && (
                            <button onClick={stopRecording} className="pattern-btn pattern-btn--stop">
                                Stop Recording
                            </button>
                        )}

                        {/* Library Stats */}
                        <div className="pattern-library-info">
                            <span>{songCount} song{songCount !== 1 ? 's' : ''} recorded</span>
                        </div>

                        {/* Song List */}
                        {songCount > 0 && (
                            <div className="pattern-song-list">
                                {Object.values(patternLibrary.songs).map((pattern) => (
                                    <div key={pattern.trackId} className="pattern-song-item">
                                        <div className="pattern-song-info">
                                            <span className="pattern-song-name">{pattern.trackName}</span>
                                            <span className="pattern-song-artist">{pattern.artistName}</span>
                                            <span className="pattern-song-events">{pattern.events.length} events</span>
                                        </div>
                                        <button
                                            onClick={() => deletePattern(pattern.trackId)}
                                            className="pattern-song-delete"
                                            title="Delete pattern"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Export/Import */}
                        <div className="pattern-actions">
                            <button onClick={exportLibrary} className="pattern-btn" disabled={songCount === 0}>
                                Export Library
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="pattern-btn">
                                Import Library
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PatternRecorder;
