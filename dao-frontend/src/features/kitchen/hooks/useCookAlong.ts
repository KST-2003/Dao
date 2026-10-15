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
  const current = [...timed].reverse().find((s) => (s.video_seconds ?? 0) <= time + 0.3) ?? null;

  return {
    player,
    isPlaying,
    current,
    marks: timed.map((s) => s.video_seconds as number),
    toggle: () => (isPlaying ? player.pause() : player.play()),
    seekTo: (seconds: number) => {
      player.currentTime = seconds;
      player.play();
    },
  };
}
