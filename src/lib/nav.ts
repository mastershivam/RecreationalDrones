// Whether a nav link points at the page being shown. The home link matches only the home page, so it is not
// "current" on every page; any other link also matches the pages below it (the country guides sit under /countries/).
export function isCurrent(pathname: string, href: string): boolean {
	return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
