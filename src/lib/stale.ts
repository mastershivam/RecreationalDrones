export interface Checked {
	label: string;
	// When a person last checked the source.
	checkedOn: Date;
}

// The items not checked for `months` months or more at `now`, oldest first.
export function staleItems(items: Checked[], now: Date, months = 6): Checked[] {
	const limit = new Date(now);
	limit.setUTCMonth(limit.getUTCMonth() - months);
	return items.filter((i) => i.checkedOn <= limit).sort((a, b) => a.checkedOn.getTime() - b.checkedOn.getTime());
}
