// The header's light/dark toggle: it flips whichever theme the page shows now (the visitor's choice, or else the
// system's), and says in words what a press does.
export type Theme = 'light' | 'dark';

export const nextTheme = (current: Theme): Theme => (current === 'dark' ? 'light' : 'dark');

export const themeLabel = (current: Theme): string => `Switch to ${nextTheme(current)} mode`;
