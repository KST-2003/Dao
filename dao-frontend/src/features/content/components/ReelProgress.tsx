import type { VideoPlayer } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { DAOText } from '@/shared/components';
import { media } from '@/shared/theme';

/** Height of the touch zone along the bottom edge (the visible line is much thinner). */
export const REEL_BAR_ZONE = 28;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Seek bar: shows playback progress, and can be tapped or dragged to jump around the video.
 * Touches are claimed outright (and not handed back to the vertical feed) so scrubbing never
 * flips to the next reel. Children ignore touches so locationX is always relative to the bar.
 */
export function ReelProgress({ player, bottom = 0, marks }: { player: VideoPlayer; bottom?: number; marks?: number[] }) {
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [drag, setDrag] = useState<number | null>(null); // 0..1 while a finger is down
  const width = useRef(1);
  const length = useRef(0);
  const startX = useRef(0);
  const fraction = useRef(0);

  useEffect(() => {
    player.timeUpdateEventInterval = 0.2;
    const tick = player.addListener('timeUpdate', (e) => {
      setPos(e.currentTime);
      setDuration(player.duration);
      length.current = player.duration;
    });
    return () => tick.remove();
  }, [player]);

  const responder = useMemo(() => {
    const at = (x: number) => Math.min(1, Math.max(0, x / width.current));
    const finish = () => {
      if (length.current > 0) player.currentTime = fraction.current * length.current;
      setDrag(null);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        startX.current = e.nativeEvent.locationX;
        fraction.current = at(startX.current);
        setDrag(fraction.current);
      },
      onPanResponderMove: (_e, g) => {
        fraction.current = at(startX.current + g.dx);
        setDrag(fraction.current);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, [player]);

  const shown = drag ?? (duration > 0 ? Math.min(1, pos / duration) : 0);
  const dragging = drag !== null;

  return (
    <View
      {...responder.panHandlers}
      onLayout={(e) => { width.current = Math.max(1, e.nativeEvent.layout.width); }}
      accessibilityRole="adjustable"
      accessibilityLabel="seek"
      style={{ position: 'absolute', left: 0, right: 0, bottom, height: REEL_BAR_ZONE, justifyContent: 'flex-end' }}
    >
      {dragging && duration > 0 ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 40, alignItems: 'center' }}>
          <DAOText variant="heading" style={{ color: media.text }}>{clock(shown * duration)} <DAOText variant="bodyMedium" style={{ color: media.textMuted }}>/ {clock(duration)}</DAOText></DAOText>
        </View>
      ) : null}
      <View pointerEvents="none" style={{ height: dragging ? 10 : 5, backgroundColor: media.track }}>
        <View style={{ width: `${shown * 100}%`, height: '100%', backgroundColor: media.text }} />
        {duration > 0 ? marks?.map((m) => (
          <View key={m} style={{ position: 'absolute', left: `${Math.min(100, (m / duration) * 100)}%`, top: -3, bottom: -3, width: 2, backgroundColor: media.gold }} />
        )) : null}
      </View>
    </View>
  );
}
