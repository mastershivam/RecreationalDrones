# To do

## Next

- [ ] **Accounts that track registrations.** Let people sign in and record which drone registrations they have completed (for example, Flyer ID done, Operator ID pending, per country), so they can see what is still outstanding before they fly. Needs a decision on sign-in method, where the data is stored (Cloudflare D1 fits the existing plan), and privacy. We should store only what is needed, and never registration numbers or ID documents unless that is a deliberate choice.
- [ ] **Step-by-step "how to register" guide for each country.** Where to register, what you need ready, what it costs, how long it lasts and what to do afterwards. Add it to each country's guide, sourced from the official authority like the rest. The registration tracker above should link to it.

## From the original plan

- [ ] Airport and restricted-airspace layers (OurAirports, OpenStreetMap, and national UAS zone data where the licence allows).
- [ ] Add more countries in batches, starting with the high-traffic ones: US, Canada, Australia, Japan, UAE, and the EU states (use EASA's common framework, with local differences on top).
- [ ] Verify the unchecked UK rules: Remote ID and insurance.
- [ ] "Report an error" form (Worker + D1 + Turnstile).
- [ ] Stale-guide check that flags any guide not verified for six months or more.
- [ ] Search across country guides (Pagefind).
- [ ] Cloudflare Web Analytics (cookieless).

## Later

- [ ] Deeper map zoom: host a bigger tile extract on R2 (the basemap currently stops at zoom 5).
- [ ] A "check my location" button.
- [ ] Printable country summary.
- [ ] Multilingual guides.
- [ ] Add a custom 404 page.
