import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { toast } from '@/shared/store/toastStore';
import { useMapPickerLocation } from './useMapPickerLocation';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const loc = jest.mocked(Location);
const fix = (lat: number, lng: number) => ({ coords: { latitude: lat, longitude: lng } }) as Location.LocationObject;

beforeEach(() => jest.clearAllMocks());

it('does nothing but notify when permission is denied', async () => {
  loc.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as Location.LocationPermissionResponse);
  const moveTo = jest.fn();
  const showSpy = jest.spyOn(toast, 'show');
  const { result } = renderHook(() => useMapPickerLocation(moveTo));
  await act(() => result.current.handleCurrentLocation());
  expect(moveTo).not.toHaveBeenCalled();
  expect(showSpy).toHaveBeenCalled();
  expect(result.current.isLocating).toBe(false);
});

it('prefers the last known position', async () => {
  loc.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  loc.getLastKnownPositionAsync.mockResolvedValue(fix(13.7, 100.5));
  const moveTo = jest.fn();
  const { result } = renderHook(() => useMapPickerLocation(moveTo));
  await act(() => result.current.handleCurrentLocation());
  expect(moveTo).toHaveBeenCalledWith([100.5, 13.7], 15);
  expect(loc.getCurrentPositionAsync).not.toHaveBeenCalled();
});

it('falls back to a fresh fix when there is no last known position', async () => {
  loc.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  loc.getLastKnownPositionAsync.mockResolvedValue(null);
  loc.getCurrentPositionAsync.mockResolvedValue(fix(16.8, 96.1));
  const moveTo = jest.fn();
  const { result } = renderHook(() => useMapPickerLocation(moveTo));
  await act(() => result.current.handleCurrentLocation());
  expect(moveTo).toHaveBeenCalledWith([96.1, 16.8], 15);
});

it('ignores a second tap while a request is in flight', async () => {
  let release: (v: Location.LocationPermissionResponse) => void = () => undefined;
  loc.requestForegroundPermissionsAsync.mockReturnValue(new Promise((r) => { release = r; }));
  loc.getLastKnownPositionAsync.mockResolvedValue(fix(1, 2));
  const { result } = renderHook(() => useMapPickerLocation(jest.fn()));
  await act(async () => {
    const first = result.current.handleCurrentLocation();
    void result.current.handleCurrentLocation();
    release({ granted: true } as Location.LocationPermissionResponse);
    await first;
  });
  expect(loc.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
});
