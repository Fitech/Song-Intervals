import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// ColorThief type declaration
declare class ColorThief {
    getColor(img: HTMLImageElement | null, quality?: number): [number, number, number] | null;
    getPalette(img: HTMLImageElement | null, colorCount?: number, quality?: number): [number, number, number][] | null;
}

// Spotify SDK type declarations
declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: typeof Spotify;
    }

    namespace Spotify {
        interface Player {
            connect(): Promise<boolean>;
            disconnect(): void;
            addListener(event: 'ready', callback: (data: { device_id: string }) => void): boolean;
            addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): boolean;
            addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): boolean;
            addListener(event: 'initialization_error', callback: (data: { message: string }) => void): boolean;
            addListener(event: 'authentication_error', callback: (data: { message: string }) => void): boolean;
            getCurrentState(): Promise<PlaybackState | null>;
            togglePlay(): Promise<void>;
            previousTrack(): Promise<void>;
            nextTrack(): Promise<void>;
        }

        interface PlaybackState {
            paused: boolean;
            position: number;
            track_window: {
                current_track: Track;
            };
        }

        interface Track {
            id: string;
            name: string;
            duration_ms: number;
            album: {
                name: string;
                images: { url: string; height: number; width: number }[];
            };
            artists: { name: string }[];
        }

        const Player: {
            new(options: { name: string; getOAuthToken: (cb: (token: string) => void) => void; volume?: number }): Player;
        };
    }
}

interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string; height: number; width: number }[];
    };
    duration_ms: number;
}

interface SpotifyContextType {
    isConnected: boolean;
    isPlaying: boolean;
    currentTrack: SpotifyTrack | null;
    position: number;
    duration: number;
    dominantColor: [number, number, number] | null;
    player: Spotify.Player | null;
    deviceId: string | null;
    connect: () => void;
    togglePlay: () => void;
    nextTrack: () => void;
    previousTrack: () => void;
    playPlaylist: (playlistUri?: string) => void;
}

const SpotifyContext = createContext<SpotifyContextType | null>(null);

export const useSpotify = () => {
    const context = useContext(SpotifyContext);
    if (!context) {
        throw new Error('useSpotify must be used within SpotifyProvider');
    }
    return context;
};

interface SpotifyProviderProps {
    children: ReactNode;
}

export const SpotifyProvider: React.FC<SpotifyProviderProps> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [_refreshToken, setRefreshToken] = useState<string | null>(null);
    const [player, setPlayer] = useState<Spotify.Player | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dominantColor, setDominantColor] = useState<[number, number, number] | null>(null);

    // Check URL for tokens on mount (after OAuth redirect)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('access_token');
        const refresh = params.get('refresh_token');

        if (token) {
            setAccessToken(token);
            localStorage.setItem('spotify_access_token', token);
            if (refresh) {
                setRefreshToken(refresh);
                localStorage.setItem('spotify_refresh_token', refresh);
            }
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Try to load from localStorage
            const storedToken = localStorage.getItem('spotify_access_token');
            const storedRefresh = localStorage.getItem('spotify_refresh_token');
            if (storedToken) setAccessToken(storedToken);
            if (storedRefresh) setRefreshToken(storedRefresh);
        }
    }, []);

    // Extract dominant color from album art
    const extractColor = useCallback(async (imageUrl: string) => {
        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imageUrl;

            img.onload = async () => {
                // Dynamically import colorthief to avoid type issues
                const ColorThiefModule = await import('colorthief');
                const colorThief = new ColorThiefModule.default();
                const color = colorThief.getColor(img);
                if (color) {
                    setDominantColor(color);
                }
            };
        } catch (err) {
            console.error('Color extraction failed:', err);
        }
    }, []);

    // Initialize Spotify Web Playback SDK
    useEffect(() => {
        if (!accessToken) return;

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new Spotify.Player({
                name: 'Workout App Player',
                getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
                volume: 0.5
            });

            spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
                console.log('Spotify Player ready with device ID:', device_id);
                setDeviceId(device_id);
                setIsConnected(true);
            });

            spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                console.log('Device has gone offline:', device_id);
                setIsConnected(false);
            });

            spotifyPlayer.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
                if (!state) return;

                const track = state.track_window.current_track;
                setCurrentTrack({
                    id: track.id,
                    name: track.name,
                    artists: track.artists,
                    album: {
                        name: track.album.name,
                        images: track.album.images
                    },
                    duration_ms: track.duration_ms
                });
                setIsPlaying(!state.paused);
                setPosition(state.position);
                setDuration(track.duration_ms);

                // Extract color from album art
                if (track.album.images.length > 0) {
                    extractColor(track.album.images[0].url);
                }
            });

            spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
                console.error('Initialization error:', message);
            });

            spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
                console.error('Authentication error:', message);
                localStorage.removeItem('spotify_access_token');
                localStorage.removeItem('spotify_refresh_token');
                setAccessToken(null);
            });

            spotifyPlayer.connect();
            setPlayer(spotifyPlayer);
        };

        return () => {
            if (player) {
                player.disconnect();
            }
        };
    }, [accessToken, extractColor]);

    // Update position periodically when playing
    useEffect(() => {
        if (!isPlaying || !player) return;

        const interval = setInterval(async () => {
            const state = await player.getCurrentState();
            if (state) {
                setPosition(state.position);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, player]);

    const connect = useCallback(() => {
        window.location.href = 'http://127.0.0.1:3001/auth/login';
    }, []);

    const togglePlay = useCallback(() => {
        player?.togglePlay();
    }, [player]);

    const nextTrack = useCallback(() => {
        player?.nextTrack();
    }, [player]);

    const previousTrack = useCallback(() => {
        player?.previousTrack();
    }, [player]);

    // Play a specific playlist (defaults to the workout playlist)
    const playPlaylist = useCallback(async (playlistUri: string = 'spotify:playlist:2yCWTfAD9DUUqa4xyCc9SC') => {
        if (!accessToken || !deviceId) {
            console.error('No access token or device ID');
            return;
        }

        try {
            // Transfer playback to this device and start the playlist
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    context_uri: playlistUri,
                })
            });
        } catch (err) {
            console.error('Failed to start playlist:', err);
        }
    }, [accessToken, deviceId]);

    return (
        <SpotifyContext.Provider
            value={{
                isConnected,
                isPlaying,
                currentTrack,
                position,
                duration,
                dominantColor,
                player,
                deviceId,
                connect,
                togglePlay,
                nextTrack,
                previousTrack,
                playPlaylist
            }}
        >
            {children}
        </SpotifyContext.Provider>
    );
};
