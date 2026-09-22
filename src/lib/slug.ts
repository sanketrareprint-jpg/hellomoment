// Pure string helper — kept separate from blogPosts.ts (which imports the
// Prisma client) so client components can use it without pulling a
// server-only dependency into the browser bundle.

/** Turns a title into a URL-safe slug, e.g. for pre-filling the admin "New post" form. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
