/**
 * On a phone, `localhost` is the phone itself, so an API URL that works in the
 * simulator cannot reach the laptop from Expo Go. Metro already knows the
 * laptop's address (it is how the phone loaded the bundle), so in development
 * the loopback host is swapped for that one.
 *
 * Any other host is left alone, and so is everything when `devHost` is unknown,
 * which is always the case in a release build.
 */
export function reachableApiUrl(configured: string, devHost: string | undefined): string {
  const host = devHost?.split(':')[0];
  if (!host) return configured;
  return configured.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/, `$1${host}`);
}
