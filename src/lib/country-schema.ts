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
	// What registering costs, in a few words (for example "$5, valid 3 years"). Shown on the map's summary.
	// How restrictive the rules are for a recreational flyer, 1 to 4 (see restrictiveness.ts), and why this guide got it.
	restrictiveness: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
	restrictivenessReason: z.string().min(10),
	registrationFee: z.string().nullable(),
	registrationWeightGrams: z.number().nonnegative().nullable(),
	minOperatorAge: z.number().int().positive().nullable(),
	remoteId: z.string().nullable(),
	insurance: z.string().nullable(),
	// The short version of registering, for someone who wants the steps rather than the rules. null means not yet written.
	howToRegister: z
		.object({
			// What to have ready before starting.
			needed: z.array(z.string().min(1)).min(1),
			steps: z.array(z.string().min(1)).min(1),
			// How long a registration lasts, or null if the authority's pages we read do not say.
			validFor: z.string().min(1).nullable(),
			// What to do once registered.
			afterwards: z.string().min(1).nullable(),
		})
		.nullable(),
	lastVerified: z.coerce.date(),
	sources: z.array(z.url()).min(1),
});
