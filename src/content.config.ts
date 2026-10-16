import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { countrySchema } from './lib/country-schema';

// One MDX file per country.
const countries = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/countries' }),
	schema: countrySchema,
});

export const collections = { countries };
