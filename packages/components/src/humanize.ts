/** Humanise a property name for a label: `checkinDate` → "Checkin Date",
 *  `cityState` → "City State". Mirrors Tapestry's
 *  `InternalCommonsUtils.toUserPresentable`, which capitalises *every* word (not
 *  just the first) and preserves the rest of each word. */
export function humanize(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
