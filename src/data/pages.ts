/**
 * Logical page names used in Gherkin ("Given I open the "explore" page") mapped
 * to locale-less paths. Add a line here to make a new page addressable.
 */
export const pageRegistry = {
  home: { path: '/', heading: null },
  explore: { path: '/explore', heading: /Markets at your fingertips/i },
  company: { path: '/company', heading: /Why MultiBank Group\?/i },
  features: { path: '/features', heading: null },
  support: { path: '/support', heading: null },
  blog: { path: '/blog', heading: null },
} as const;

export type PageName = keyof typeof pageRegistry;

export function resolvePage(name: string): (typeof pageRegistry)[PageName] {
  const entry = pageRegistry[name as PageName];
  if (!entry) {
    throw new Error(`Unknown page "${name}". Known pages: ${Object.keys(pageRegistry).join(', ')}`);
  }
  return entry;
}
