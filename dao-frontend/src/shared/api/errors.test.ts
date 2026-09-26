import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, toApiError } from './errors';

describe('toApiError', () => {
  it('normalizes the backend error shape', () => {
    const err = new AxiosError('fail', 'ERR', undefined, undefined, {
      status: 422, statusText: '', headers: {}, config: { headers: new AxiosHeaders() },
      data: { message: 'Only a few left', code: 'INSUFFICIENT_STOCK', errors: { available: 2 } },
    });
    const e = toApiError(err);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(422);
    expect(e.code).toBe('INSUFFICIENT_STOCK');
    expect(e.errors.available).toBe(2);
  });

  it('marks missing responses as network errors', () => {
    const e = toApiError(new AxiosError('Network Error'));
    expect(e.isNetwork).toBe(true);
    expect(e.code).toBe('NETWORK_ERROR');
  });
});
