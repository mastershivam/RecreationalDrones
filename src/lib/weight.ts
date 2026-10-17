// The answer to "my drone weighs X g: do I need to register here?", from the guide's lowest registration weight.
// It says where registration starts and never that a flight is allowed (DESIGN.md, Voice); other rules still apply.
export function weightAnswer(grams: number, threshold: number | null): string {
	if (!Number.isFinite(grams) || grams <= 0) return 'Enter your drone’s weight in grams.';
	if (threshold === null) return 'We have not yet verified the weight where registration starts. Check the official source.';
	if (threshold === 0) return 'Registration applies at any weight here.';
	if (grams < threshold) return `Registration starts at ${threshold} g, and ${grams} g is under that. Other rules still apply.`;
	return `Registration starts at ${threshold} g, and ${grams} g is ${grams === threshold ? 'right at' : 'over'} that. See the steps in the full guide.`;
}
