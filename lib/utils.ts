export function cn(...input: Array<string | false | null | undefined>) {
  return input.filter(Boolean).join(' ');
}
