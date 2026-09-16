# Known issues

Deferred on purpose. Each needs a decision or a device before it can be fixed.

## Sign-up and email limits count per network address

Limits are per IP: 5 sign-ups an hour, 5 password-reset or verification emails an hour.
UF's network (`128.227.0.0/16`) can put a whole room behind one address, so the sixth
student signing up on campus Wi-Fi at the showcase would get a 429. Needs rethinking
before 11/19. Related: per-address limits cannot fully protect Resend's shared daily quota
of 100 emails on the free tier.

## Locked units are only locked in the UI

The API does not check prerequisites. A learner calling it directly can complete a locked
unit and earn XP and leaderboard rank from it.

## Native sign-in is untested, and likely fails in Expo Go

The Expo auth client sends its origin from `Linking.createURL`, which is `exp://...` in Expo
Go. Production only trusts `fineduapp://`, so sign-in on a phone through Expo Go would
probably fail with "Invalid origin". Needs a real device test.

## The leaderboard shows sign-up names to everyone

Whatever a learner typed as their name at sign-up is visible to every other learner, with no
display name or opt-out, and no length cap on the name.
