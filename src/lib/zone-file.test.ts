import { describe, expect, it } from 'vitest';
import { zoneFileText } from './zone-file';

const meta = { iso3: 'NPL' };
const feature = (id: string) => ({ type: 'Feature', properties: { id } });

describe('zoneFileText', () => {
	it('is valid JSON that reads back as the collection', () => {
		const features = [feature('a'), feature('b')];
		expect(JSON.parse(zoneFileText({ meta, features }))).toEqual({ type: 'FeatureCollection', meta, features });
	});

	it('puts each zone on its own line, so a diff shows one line per changed zone', () => {
		const lines = zoneFileText({ meta, features: [feature('a'), feature('b'), feature('c')] }).split('\n');
		expect(lines.filter((l) => l.includes('"Feature"'))).toHaveLength(3);
		expect(lines.filter((l) => l.includes('"id":"b"'))).toHaveLength(1);
	});

	it('is valid for an empty file and ends with a newline', () => {
		const text = zoneFileText({ meta, features: [] });
		expect(JSON.parse(text).features).toEqual([]);
		expect(text.endsWith('\n')).toBe(true);
	});
});
