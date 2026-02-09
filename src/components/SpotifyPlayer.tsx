import React from 'react';
import { useSpotify } from '../context/SpotifyContext';

export const SpotifyPlayer: React.FC = () => {
    const {
        isConnected,
        isPlaying,
        currentTrack,
        position,
        duration,
        dominantColor,
        connect,
        togglePlay,
        nextTrack,
        previousTrack,
        playPlaylist
    } = useSpotify();

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    // Create gradient background from dominant color
    const bgStyle = dominantColor
        ? {
            background: `linear-gradient(135deg, 
                rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.5) 40%, 
                rgba(0, 0, 0, 0.5) 100%)`,
            borderColor: `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.5)`
        }
        : {
            background: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
        };

    // Handle play - if no track is playing, start the playlist
    const handlePlay = () => {
        if (!currentTrack) {
            playPlaylist();
        } else {
            togglePlay();
        }
    };

    if (!isConnected) {
        return (
            <div className="spotify-player spotify-player--disconnected" style={bgStyle}>
                <button onClick={connect} className="spotify-connect-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Connect Spotify
                </button>
            </div>
        );
    }

    return (
        <div className="spotify-player" style={bgStyle}>
            {/* Album Art - on top */}
            <div className="spotify-album-art">
                {currentTrack?.album.images[0] ? (
                    <img
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.album.name}
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className="spotify-album-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content Row: Track Info + Controls */}
            <div className="spotify-content-row">
                {/* Track Info - left side */}
                <div className="spotify-track-info">
                    <div className="spotify-track-name">
                        {currentTrack?.name || 'Click play to start'}
                    </div>
                    <div className="spotify-artist-name">
                        {currentTrack?.artists.map(a => a.name).join(', ') || 'Workout playlist ready'}
                    </div>
                </div>

                {/* Controls - right side */}
                <div className="spotify-controls">
                    <button onClick={previousTrack} className="spotify-control-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                        </svg>
                    </button>
                    <button onClick={handlePlay} className="spotify-control-btn spotify-control-btn--play">
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                    <button onClick={nextTrack} className="spotify-control-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Progress Bar - full width at bottom */}
            <div className="spotify-progress">
                <span className="spotify-time">{formatTime(position)}</span>
                <div className="spotify-progress-bar">
                    <div
                        className="spotify-progress-fill"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }}
                    />
                </div>
                <span className="spotify-time">{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default SpotifyPlayer;
