import api from './api';

describe('API Client', () => {
  it('exports an axios instance', () => {
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.timeout).toBe(15000);
  });

  it('has correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
