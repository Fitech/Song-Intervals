import { useState, useEffect, useRef, useCallback } from 'react';
import { RoadScene } from './components/RoadScene';
import { MotivationalOverlay } from './components/MotivationalOverlay';
import { SpotifyProvider, useSpotify } from './context/SpotifyContext';
import { PatternProvider, usePattern } from './context/PatternContext';
import SpotifyPlayer from './components/SpotifyPlayer';
import PatternRecorder from './components/PatternRecorder';
import { useSongPattern } from './hooks/useSongPattern';

import ParticleExplosion from './components/ParticleExplosion';
import WorkModeSpinners from './components/WorkModeSpinners';

function AppContent() {
  const [intensity, setIntensity] = useState(0);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const { dominantColor, currentTrack, position } = useSpotify();
  const { isRecording, startRecording, stopRecording, saveAndStartNew, recordEvent } = usePattern();

  // Refs to avoid stale closures in event listener
  const activeMessageRef = useRef<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intensityRef = useRef(intensity);
  const isRecordingRef = useRef(isRecording);
  const currentTrackRef = useRef(currentTrack);
  const positionRef = useRef(position);
  const lastRecordedTrackIdRef = useRef<string | null>(null);

  // Sync refs with state
  useEffect(() => {
    activeMessageRef.current = activeMessage;
  }, [activeMessage]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Track change detection - auto-save and continue recording
  useEffect(() => {
    if (!currentTrack) return;

    // If recording and track changed, save current and start new
    if (isRecording && lastRecordedTrackIdRef.current && currentTrack.id !== lastRecordedTrackIdRef.current) {
      saveAndStartNew(
        currentTrack.id,
        currentTrack.name,
        currentTrack.artists.map(a => a.name).join(', '),
        currentTrack.duration_ms
      );
    }

    // Update last recorded track ID when recording starts or track changes during recording
    if (isRecording) {
      lastRecordedTrackIdRef.current = currentTrack.id;
    }
  }, [currentTrack, isRecording, saveAndStartNew]);

  // Callbacks for pattern playback
  const handlePatternIntensity = useCallback((level: number) => {
    setIntensity(level);
  }, []);

  const handlePatternMessage = useCallback((message: string) => {
    setActiveMessage(message);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setActiveMessage(null);
    }, 2000);
  }, []);

  // Use pattern playback hook (only applies when not recording)
  useSongPattern({
    onIntensityChange: isRecording ? () => { } : handlePatternIntensity,
    onMessageTrigger: isRecording ? () => { } : handlePatternMessage
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      // Handle 'R' for recording toggle
      if (key === 'r' || key === 'R') {
        if (isRecordingRef.current) {
          stopRecording();
          lastRecordedTrackIdRef.current = null;
        } else if (currentTrackRef.current) {
          lastRecordedTrackIdRef.current = currentTrackRef.current.id;
          startRecording(
            currentTrackRef.current.id,
            currentTrackRef.current.name,
            currentTrackRef.current.artists.map(a => a.name).join(', '),
            currentTrackRef.current.duration_ms
          );
        }
        return;
      }

      // Handle number keys 0-9 (0 maps to 10)
      if (key >= '0' && key <= '9') {
        const value = key === '0' ? 10 : parseInt(key);
        setIntensity(value);

        // Record intensity change if recording
        if (isRecordingRef.current) {
          recordEvent({
            timestamp: positionRef.current,
            type: 'intensity',
            data: { level: value }
          });
        }
        return;
      }

      // Handle motivational triggers (Space moved to 'k')
      const triggers: { [key: string]: string } = {
        'k': 'KEEP GOING!',
        'K': 'KEEP GOING!',
        'Enter': 'PUSH IT!',
        'ArrowUp': 'FASTER!',
        'ArrowDown': 'RECOVER',
        'f': '🔥 BURN 🔥',
        'F': '🔥 BURN 🔥',
        'p': 'POWER',
        'P': 'POWER',
        's': 'STRONG',
        'S': 'STRONG',
      };

      if (triggers[key]) {
        const newMessage = triggers[key];

        // Clear existing timeout
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
          messageTimeoutRef.current = null;
        }

        // If the same message is already active, toggle it OFF
        if (activeMessageRef.current === newMessage) {
          setActiveMessage(null);
        } else {
          // Otherwise set the new message and start timer
          setActiveMessage(newMessage);

          // Record message if recording
          if (isRecordingRef.current) {
            recordEvent({
              timestamp: positionRef.current,
              type: 'message',
              data: { text: newMessage, key }
            });
          }

          messageTimeoutRef.current = setTimeout(() => {
            setActiveMessage(null);
          }, 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startRecording, stopRecording, recordEvent]);

  return (
    <div className="dashboard-container relative overflow-hidden bg-gray-900 w-full h-screen">
      <RoadScene intensity={intensity} dominantColor={dominantColor} />
      <MotivationalOverlay intensity={intensity} message={activeMessage} />
      {intensity === 8 && <ParticleExplosion variant="subtle" />}
      {intensity === 9 && <ParticleExplosion variant="medium" />}
      {intensity >= 10 && <ParticleExplosion variant="normal" />}
      {intensity >= 3 && <WorkModeSpinners />}
      <SpotifyPlayer />
      <PatternRecorder />
    </div>
  );
}

function App() {
  return (
    <SpotifyProvider>
      <PatternProvider>
        <AppContent />
      </PatternProvider>
    </SpotifyProvider>
  );
}

export default App;
