// Where the site lives, in one place. Change SITE_URL when a custom domain is attached: the sitemap, the canonical
// links and the social image address are all made from it.
export const SITE_URL = 'https://recreationaldrones.shivamlakhani03.workers.dev';
export const SITE_NAME = 'Recreational Drones';
export const REPO_URL = 'https://github.com/mastershivam/RecreationalDrones';
export const ISSUES_URL = `${REPO_URL}/issues`;

// Cloudflare Web Analytics (cookieless). Make a site for this address in the Cloudflare dashboard (Analytics & logs,
// Web Analytics), paste its token here, and the page loads the beacon. While this is null, nothing is loaded and the
// privacy page's "no analytics" is true. If you set it, update src/pages/privacy.astro in the same change: a test fails otherwise.
export const ANALYTICS_TOKEN: string | null = null;
