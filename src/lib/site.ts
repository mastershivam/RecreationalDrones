// Where the site lives, in one place. Change SITE_URL when a custom domain is attached: the sitemap, the canonical
// links and the social image address are all made from it.
export const SITE_URL = 'https://recreationaldrones.shivamlakhani03.workers.dev';
export const SITE_NAME = 'Recreational Drones';
export const REPO_URL = 'https://github.com/mastershivam/RecreationalDrones';
export const ISSUES_URL = `${REPO_URL}/issues`;

// Cloudflare Web Analytics (cookieless): counts visits and page views, and does not track individual visitors.
// This is the token of the site made for this address in the Cloudflare dashboard (Analytics & logs, Web Analytics).
// It is not a secret, since it is in every page's HTML. Set it to null to turn analytics off. If you change whether
// it is on, update src/pages/privacy.astro in the same change: a test fails otherwise.
export const ANALYTICS_TOKEN: string | null = 'e05325bed09d4170aefcaa4f5f474b22';

// The only addresses outside this site that a page may contact, and only because analytics is on: the beacon script,
// and the address it reports to.
export const ANALYTICS_HOSTS: string[] = ANALYTICS_TOKEN ? ['static.cloudflareinsights.com', 'cloudflareinsights.com'] : [];
