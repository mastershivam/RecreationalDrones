// Reads CSV text (RFC 4180: quoted fields, "" for a quote, CRLF or LF) into one object per row, keyed by the header.
export function parseCsv(text: string): Record<string, string>[] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c !== '"') field += c;
			else if (text[i + 1] === '"') (field += '"', i++);
			else quoted = false;
		} else if (c === '"') quoted = true;
		else if (c === ',') (row.push(field), (field = ''));
		else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			(row = []), (field = '');
		} else field += c;
	}
	if (field !== '' || row.length) (row.push(field), rows.push(row));
	const [header, ...body] = rows;
	return body.filter((r) => r.length > 1 || r[0] !== '').map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}
