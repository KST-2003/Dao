import type { MapState } from '@rnmapbox/maps';
import { act, renderHook } from '@testing-library/react-native';
import { reverseGeocodeApi } from '@/shared/api/mapbox';
import { useMapPickerCamera } from './useMapPickerCamera';

jest.mock('@rnmapbox/maps', () => ({}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
jest.mock('@/shared/api/mapbox', () => ({ reverseGeocodeApi: jest.fn() }));

const reverse = jest.mocked(reverseGeocodeApi);
const moved = (lng: number, lat: number) => ({ properties: { center: [lng, lat] } }) as unknown as MapState;

beforeEach(() => { jest.useFakeTimers(); reverse.mockReset(); });
afterEach(() => jest.useRealTimers());

it('debounces rapid camera changes into one reverse geocode', async () => {
  reverse.mockResolvedValue('Sukhumvit Rd');
  const { result } = renderHook(() => useMapPickerCamera([100, 13], ''));
  act(() => { result.current.handleCameraChanged(moved(1, 1)); result.current.handleCameraChanged(moved(2, 2)); result.current.handleCameraChanged(moved(3, 3)); });
  await act(async () => { jest.advanceTimersByTime(600); });
  expect(reverse).toHaveBeenCalledTimes(1);
  expect(reverse).toHaveBeenCalledWith(3, 3, 'en');
  expect(result.current.resolvedAddress).toBe('Sukhumvit Rd');
});

it('discards a stale response when the camera moved again', async () => {
  let resolveFirst: (v: string) => void = () => undefined;
  reverse.mockReturnValueOnce(new Promise((r) => { resolveFirst = r; })).mockResolvedValueOnce('Second');
  const { result } = renderHook(() => useMapPickerCamera([100, 13], ''));
  act(() => result.current.handleCameraChanged(moved(1, 1)));
  await act(async () => { jest.advanceTimersByTime(600); });
  act(() => result.current.handleCameraChanged(moved(2, 2)));
  await act(async () => { jest.advanceTimersByTime(600); });
  await act(async () => { resolveFirst('First (stale)'); });
  expect(result.current.resolvedAddress).toBe('Second');
});
