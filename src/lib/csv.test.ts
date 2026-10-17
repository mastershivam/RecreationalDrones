import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
	it('keys each row by the header', () => {
		expect(parseCsv('a,b\n1,2\n3,4\n')).toEqual([
			{ a: '1', b: '2' },
			{ a: '3', b: '4' },
		]);
	});

	it('keeps commas, doubled quotes and empty fields inside quoted fields', () => {
		expect(parseCsv('name,note\n"Tribhuvan, Kathmandu","say ""hi"""\n,"x"\n')).toEqual([
			{ name: 'Tribhuvan, Kathmandu', note: 'say "hi"' },
			{ name: '', note: 'x' },
		]);
	});

	it('reads CRLF line endings and a file with no final newline', () => {
		expect(parseCsv('a,b\r\n1,2\r\n3,4')).toEqual([
			{ a: '1', b: '2' },
			{ a: '3', b: '4' },
		]);
	});

	it('keeps a newline inside a quoted field', () => {
		expect(parseCsv('a\n"x\ny"\n')).toEqual([{ a: 'x\ny' }]);
	});

	it('gives an empty list for a header with no rows', () => {
		expect(parseCsv('a,b\n')).toEqual([]);
	});
});
