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

## Native sign-in is untested, and likely fails in Expo Go

The Expo auth client sends its origin from `Linking.createURL`, which is `exp://...` in Expo
Go. Production only trusts `fineduapp://`, so sign-in on a phone through Expo Go would
probably fail with "Invalid origin". Needs a real device test.
