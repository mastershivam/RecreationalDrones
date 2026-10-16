# To do

## Next

- [ ] **Accounts that track registrations.** Let people sign in and record which drone registrations they have completed (for example, Flyer ID done, Operator ID pending, per country), so they can see what is still outstanding before they fly. Needs a decision on sign-in method, where the data is stored (Cloudflare D1 fits the existing plan), and privacy. We should store only what is needed, and never registration numbers or ID documents unless that is a deliberate choice.
- [ ] **Step-by-step "how to register" guide for each country.** Where to register, what you need ready, what it costs, how long it lasts and what to do afterwards. Add it to each country's guide, sourced from the official authority like the rest. The registration tracker above should link to it.
- [ ] **Colour-code highlighted countries by how restrictive the rules are.** Replace the single amber highlight with four categories: 1) no restrictions, 2) basic registration, 3) complex registration or exams, 4) fully restricted. Open points: add a required `restrictiveness` field (1 to 4) to the guide schema so a guide can't ship without one; write down the criteria for each category so the call is consistent and explained to readers (for example, "basic" is an online registration, "complex" needs a test or in-person step); pick a colour-blind-safe palette with a legend, and don't rely on colour alone (DESIGN.md principle 5), for instance with patterns or labels; update DESIGN.md, since amber currently means "we have a guide". The category is a judgement call, so each one should link to the official source it was based on.
- [ ] **Automate the data refresh.** A scheduled GitHub Action (weekly or monthly) that rebuilds the country shapes (`npm run build:countries`), re-extracts the latest Protomaps basemap, runs the full test suite, and opens a pull request with the changes rather than pushing straight to `main`. Open points: the 15 MB tile file adds that much to git history on every refresh, so consider fetching it at build time or keeping it outside git (a release asset or R2) instead of committing it; and rules text can't be refreshed automatically, so the job should instead flag guides whose official source pages have changed or that haven't been verified for six months (see the stale-guide check below).

## From the original plan

- [ ] Airport and restricted-airspace layers (OurAirports, OpenStreetMap, and national UAS zone data where the licence allows).
- [ ] Add more countries in batches, starting with the high-traffic ones: US, Canada, Australia, Japan, UAE, and the EU states (use EASA's common framework, with local differences on top).
- [ ] Verify the unchecked UK rules: Remote ID and insurance.
- [ ] "Report an error" form (Worker + D1 + Turnstile).
- [ ] Stale-guide check that flags any guide not verified for six months or more.
- [ ] Search across country guides (Pagefind).
- [ ] Cloudflare Web Analytics (cookieless).

## Later

- [ ] **More detailed country areas when zoomed in.** Show regions inside each country (states, provinces and similar) at higher zoom, since some rules and restricted areas differ by region. Needs a region boundary source (for example Natural Earth admin-1), a decision on how region rules link to the country guide, and tiles beyond zoom 5, which goes together with the deeper-zoom item below.
- [ ] Deeper map zoom: host a bigger tile extract on R2 (the basemap currently stops at zoom 5).
- [ ] A "check my location" button.
- [ ] Printable country summary.
- [ ] Multilingual guides.
- [ ] Add a custom 404 page.
