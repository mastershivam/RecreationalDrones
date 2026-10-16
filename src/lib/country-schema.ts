import { z } from 'astro/zod';

// Frontmatter for one country guide. Rule fields are nullable: null means
// "not yet verified", and the page tells readers to check the official source.
export const countrySchema = z.object({
	name: z.string(),
	// ISO 3166-1 alpha-3; matches ADM0_A3 on the map's country layer.
	iso3: z.string().regex(/^[A-Z]{3}$/),
	authority: z.string(),
	authorityUrl: z.url(),
	registrationUrl: z.url().nullable(),
	whoMustRegister: z.string().nullable(),
	registrationWeightGrams: z.number().nonnegative().nullable(),
	minOperatorAge: z.number().int().positive().nullable(),
	remoteId: z.string().nullable(),
	insurance: z.string().nullable(),
	lastVerified: z.coerce.date(),
	sources: z.array(z.url()).min(1),
});
