export function isIsoDurationOver(
  duration: string,
  minutesLimit: number,
): boolean {
  const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const match = duration.match(regex);

  if (!match) return false;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const limitSeconds = minutesLimit * 60;

  return totalSeconds > limitSeconds;
}
