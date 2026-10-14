# Known issues

Deferred on purpose. Each needs a decision or a device before it can be fixed.

## Email requests are limited per network address

Sign-up now allows 30 per address an hour, with a global cap of 300 an hour, so a class on
campus Wi-Fi can register together. Password-reset and verification-resend requests are still
5 per address an hour, so a room behind UF's single address (`128.227.0.0/16`) shares those 5.
They are rare enough that this should not matter at the showcase.

Separately, Resend's free tier sends 100 emails a day across everyone. The sign-up cap allows
more sign-ups than that, so on a busy day later verification emails would not be sent. Sign-up
itself still works, since verification is optional.

## Expo Go cannot sign in against the deployed API

Native sign-in was confirmed on an iPhone in Expo Go on 2026-10-14, against a local API
started with `pnpm dev:api:lan`. Sign-up, sign-in, a full lesson with its summary and
level-up, an ordering exercise, staying signed in after reopening the app, sign-out,
the leaderboard and profile tabs, dark mode, and account deletion all worked.

Expo Go reports its origin as `exp://<laptop address>:8081`. Local development trusts
`exp://`; production trusts only `fineduapp://`, so Expo Go against the deployed API is
refused with "Invalid origin". That is deliberate: trusting `exp://` in production would
also let password-reset and verification links redirect to any `exp://` host. A
development or release build uses `fineduapp://` and is trusted.
