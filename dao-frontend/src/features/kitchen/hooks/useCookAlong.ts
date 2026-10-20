import { useEvent } from 'expo';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecipeDetail } from '@/types/models';

type Step = RecipeDetail['steps'][number];

/**
 * Player state for "Watch Dao cook": the step being shown right now is the last step whose video time has
 * passed, and tapping a step seeks the same player (so captions, bar and list stay in sync).
 */
export function useCookAlong(uri: string, steps: Step[], startAt: number) {
  const [time, setTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const seeded = useRef(false);
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    const tick = player.addListener('timeUpdate', (e) => setTime(e.currentTime));
    // The first seek has to wait until the source is loaded, otherwise it is silently ignored.
    const ready = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && !seeded.current) {
        seeded.current = true;
        if (startAt > 0) {
          player.currentTime = startAt;
          player.play();
        }
      }
    });
    return () => {
      tick.remove();
      ready.remove();
    };
  }, [player, startAt]);

  useFocusEffect(
    useCallback(() => () => {
      try {
        player.pause();
      } catch {
        // already released
      }
    }, [player]),
  );

  const timed = steps.filter((s) => s.video_seconds != null);
  // A caption shows from its start until its end (or, with no end, until the next step starts).
  const current = timed.find((s, i) => {
    const start = s.video_seconds ?? 0;
    const end = s.video_end_seconds ?? timed[i + 1]?.video_seconds ?? Infinity;
    return time + 0.3 >= start && time < end;
  }) ?? null;

  return {
    player,
    isPlaying,
    current,
    marks: timed.map((s) => s.video_seconds as number),
    fullscreen,
    toggleFullscreen: () => setFullscreen((f) => !f),
    toggle: () => (isPlaying ? player.pause() : player.play()),
    seekTo: (seconds: number) => {
      player.currentTime = seconds;
      player.play();
    },
  };
}
