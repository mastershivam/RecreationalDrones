// Links to other sites open in a new tab, so the map and the guide stay where they are.
// Links within the site stay in this tab.
export function isExternal(href: string): boolean {
	return /^https?:\/\//.test(href);
}

// Attributes for an <a> in an Astro template: spread them onto the link.
export function linkAttrs(href: string): { target?: string; rel?: string } {
	return isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

// The same attributes as text, for links built as HTML strings.
export function linkAttrsHtml(href: string): string {
	return isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

// A Markdown plugin for MDX guides, whose markdown links Astro renders with no attributes.
export const externalLinks = {
	name: 'external-links',
	element: {
		filter: ['a'],
		visit(node: { properties?: Record<string, unknown> }, ctx: { setProperty(node: unknown, key: string, value: unknown): void }) {
			const href = node.properties?.href;
			if (typeof href !== 'string') return;
			for (const [key, value] of Object.entries(linkAttrs(href))) ctx.setProperty(node, key, value);
		},
	},
};
