import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactPath } from '../request-log.ts';

test('redacts a verification token in the query string', () => {
  assert.equal(
    redactPath('/api/auth/verify-email?token=eyJhbGciOi.secret.sig&callbackURL=%2F'),
    '/api/auth/verify-email?token=[redacted]&callbackURL=%2F',
  );
});

test('redacts a password-reset token in the path', () => {
  assert.equal(
    redactPath('/api/auth/reset-password/abc123secret?callbackURL=%2Freset-password'),
    '/api/auth/reset-password/[redacted]?callbackURL=%2Freset-password',
  );
});

test('redacts any parameter named like a token, however it is encoded', () => {
  assert.equal(redactPath('/x?resetToken=s1&a=1'), '/x?resetToken=[redacted]&a=1');
  assert.equal(redactPath('/x?%74oken=s2'), '/x?%74oken=[redacted]');
});

test('leaves ordinary paths and malformed encodings alone', () => {
  assert.equal(redactPath('/api/progress/me'), '/api/progress/me');
  assert.equal(redactPath('/api/leaderboard?period=weekly'), '/api/leaderboard?period=weekly');
  assert.equal(redactPath('/x?%E0%A4%A=1'), '/x?%E0%A4%A=1');
});
