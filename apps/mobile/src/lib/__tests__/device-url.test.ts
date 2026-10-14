import { describe, expect, it } from 'vitest';

import { reachableApiUrl } from '../device-url';

describe('reachableApiUrl', () => {
  it('points a loopback API at the host Metro is serving from', () => {
    expect(reachableApiUrl('http://localhost:8787', '192.168.1.20:8081')).toBe(
      'http://192.168.1.20:8787',
    );
    expect(reachableApiUrl('http://127.0.0.1:8787/', '192.168.1.20:8081')).toBe(
      'http://192.168.1.20:8787/',
    );
  });

  it('leaves a real API host alone', () => {
    const deployed = 'https://fin-edu-api.joshcaron.workers.dev';
    expect(reachableApiUrl(deployed, '192.168.1.20:8081')).toBe(deployed);
    // A host that merely starts with "localhost" is not loopback.
    expect(reachableApiUrl('http://localhost.example.com', '192.168.1.20')).toBe(
      'http://localhost.example.com',
    );
  });

  it('changes nothing without a dev host, as in a release build', () => {
    expect(reachableApiUrl('http://localhost:8787', undefined)).toBe('http://localhost:8787');
    expect(reachableApiUrl('http://localhost:8787', '')).toBe('http://localhost:8787');
  });
});
