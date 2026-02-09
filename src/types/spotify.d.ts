// Spotify Web Playback SDK types
declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: typeof Spotify;
    }
}

declare namespace Spotify {
    interface Player {
        connect(): Promise<boolean>;
        disconnect(): void;
        addListener(event: 'ready', callback: (data: { device_id: string }) => void): boolean;
        addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): boolean;
        addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): boolean;
        addListener(event: 'initialization_error', callback: (data: { message: string }) => void): boolean;
        addListener(event: 'authentication_error', callback: (data: { message: string }) => void): boolean;
        addListener(event: 'account_error', callback: (data: { message: string }) => void): boolean;
        addListener(event: 'playback_error', callback: (data: { message: string }) => void): boolean;
        removeListener(event: string, callback?: () => void): boolean;
        getCurrentState(): Promise<PlaybackState | null>;
        setName(name: string): Promise<void>;
        getVolume(): Promise<number>;
        setVolume(volume: number): Promise<void>;
        pause(): Promise<void>;
        resume(): Promise<void>;
        togglePlay(): Promise<void>;
        seek(position_ms: number): Promise<void>;
        previousTrack(): Promise<void>;
        nextTrack(): Promise<void>;
    }

    interface PlayerInit {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
    }

    interface PlaybackState {
        context: {
            uri: string;
            metadata: object;
        };
        disallows: {
            pausing: boolean;
            peeking_next: boolean;
            peeking_prev: boolean;
            resuming: boolean;
            seeking: boolean;
            skipping_next: boolean;
            skipping_prev: boolean;
        };
        paused: boolean;
        position: number;
        repeat_mode: number;
        shuffle: boolean;
        track_window: {
            current_track: Track;
            previous_tracks: Track[];
            next_tracks: Track[];
        };
    }

    interface Track {
        id: string;
        uri: string;
        type: string;
        media_type: string;
        name: string;
        is_playable: boolean;
        album: {
            uri: string;
            name: string;
            images: { url: string; height: number; width: number }[];
        };
        artists: { uri: string; name: string }[];
        duration_ms: number;
    }

    const Player: {
        new(options: PlayerInit): Player;
    };
}

declare module 'colorthief' {
    export default class ColorThief {
        getColor(img: HTMLImageElement | null, quality?: number): [number, number, number] | null;
        getPalette(img: HTMLImageElement | null, colorCount?: number, quality?: number): [number, number, number][] | null;
    }
}

export { };
