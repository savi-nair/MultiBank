export interface NavDestination {
  label: string;
  kind: 'internal' | 'external';
  /** Locale-less path for internal items. */
  path?: string;
  /** Expected href pattern for external items. */
  href?: RegExp;
  /** Optional extra checks on arrival. */
  title?: RegExp;
  heading?: RegExp;
}

/** Primary navigation, in the order it is rendered in the header. */
export const primaryNav: NavDestination[] = [
  { label: 'Explore', kind: 'internal', path: '/explore', title: /Explore/i, heading: /Markets at your fingertips/i },
  { label: 'Features', kind: 'internal', path: '/features' },
  { label: 'OTC Desk', kind: 'internal', path: '/features/otc-desk', title: /OTC/i },
  { label: 'Company', kind: 'internal', path: '/company', title: /About/i, heading: /Why MultiBank Group\?/i },
  { label: 'Support', kind: 'internal', path: '/support' },
  { label: 'Blog', kind: 'internal', path: '/blog' },
  { label: '$MBG', kind: 'external', href: /^https:\/\/token\.multibankgroup\.com\// },
];

/** Account CTAs - only their targets are verified; no account is ever created. */
export const headerCtas: NavDestination[] = [
  { label: 'Sign in', kind: 'external', href: /^https:\/\/trade\.mb\.io\/login\b/ },
  { label: 'Sign up', kind: 'external', href: /^https:\/\/trade\.mb\.io\/register\b/ },
];

export function findHeaderLink(label: string): NavDestination {
  const item = [...primaryNav, ...headerCtas].find((i) => i.label === label);
  if (!item) throw new Error(`No navigation test data for "${label}" - add it to src/data/navigation.ts`);
  return item;
}
