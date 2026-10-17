# To do

## Next

- [ ] **Accounts that track registrations.** Let people sign in and record which drone registrations they have completed (for example, Flyer ID done, Operator ID pending, per country), so they can see what is still outstanding before they fly. Needs a decision on sign-in method, where the data is stored (Cloudflare D1 fits the existing plan), and privacy. We should store only what is needed, and never registration numbers or ID documents unless that is a deliberate choice.
- [ ] **Step-by-step "how to register" guide for each country.** Where to register, what you need ready, what it costs, how long it lasts and what to do afterwards. Add it to each country's guide, sourced from the official authority like the rest. The registration tracker above should link to it.
- [ ] **Colour-code highlighted countries by how restrictive the rules are.** Replace the single amber highlight with four categories: 1) no restrictions, 2) basic registration, 3) complex registration or exams, 4) fully restricted. Open points: add a required `restrictiveness` field (1 to 4) to the guide schema so a guide can't ship without one; write down the criteria for each category so the call is consistent and explained to readers (for example, "basic" is an online registration, "complex" needs a test or in-person step); pick a colour-blind-safe palette with a legend, and don't rely on colour alone (DESIGN.md principle 5), for instance with patterns or labels; update DESIGN.md, since amber currently means "we have a guide". The category is a judgement call, so each one should link to the official source it was based on.
- [ ] **Automate the data refresh.** A scheduled GitHub Action (weekly or monthly) that rebuilds the country shapes (`npm run build:countries`), re-extracts the latest Protomaps basemap, runs the full test suite, and opens a pull request with the changes rather than pushing straight to `main`. Open points: the 15 MB tile file adds that much to git history on every refresh, so consider fetching it at build time or keeping it outside git (a release asset or R2) instead of committing it; and rules text can't be refreshed automatically, so the job should instead flag guides whose official source pages have changed or that haven't been verified for six months (see the stale-guide check below).
- [ ] **Weather at a chosen location.** Let people pick a place on the globe (and later use their own location, see "check my location" below) and see the conditions that matter for flying: wind speed and gusts, rain, visibility and temperature, with the time they apply to. Open points: pick a free weather source with no API key and check its licence and attribution terms (Open-Meteo is the likely candidate); decide how to pick a place (click the map, search, or both) and where the result shows (probably in the same large popup as the country guide, or a small panel); show the forecast time and the source, and say plainly when the data can't be loaded. It should show conditions only, never a "safe to fly" verdict, which the guidance-only disclaimer doesn't allow us to give.

## From the original plan

- [ ] Airport and restricted-airspace layers (OurAirports, OpenStreetMap, and national UAS zone data where the licence allows).
- [ ] Add more countries in batches (the UK, Nepal and Thailand have guides so far), starting with the high-traffic ones: US, Canada, Australia, Japan, UAE, and the EU states (use EASA's common framework, with local differences on top).
- [ ] Verify the unchecked UK rules: Remote ID and insurance.
- [x] **Finish Nepal's guide.** Registration, categories, permission to fly, flying limits, pilot licence and Remote ID are now covered from CAAN's UAS Requirements (Issue 01, April 2021), its drones page and its drone application form (checked 2026-10-17, via Internet Archive copies, because the caanepal.gov.np certificate does not validate from here).
- [ ] **Nepal: the remaining gaps.** Still unverified: the official list of prohibited and restricted areas (national parks, Kathmandu valley, Everest region), whether recreational flyers need a remote pilot licence (and so the minimum age), and insurance for drones under 2 kg. Read the Ministry of Home Affairs Drone Operation Procedure, 2019, or ask CAAN. Also check whether `drone.caanepal.gov.np` (linked from CAAN's drones page) is the online registration portal, and if so set it as `registrationUrl`. Don't use blog posts for these, because they contradict each other (for example USD 10 vs CAAN's USD 50 fee).
- [ ] **Thailand: the remaining gaps.** Registration, the pilot certificate, insurance and flying limits are covered from CAAT's two leaflets and its registration page (read 2026-10-17; caat.or.th blocks automated downloads, so they were saved from a browser). Still unverified: the NBTC's radio-frequency permission (read the NBTC's own drone criteria and registration pages), fees, minimum age, Remote ID, penalties, the list of banned areas, and whether drones under 2 kg without a camera are exempt.
- [ ] "Report an error" form (Worker + D1 + Turnstile).
- [ ] Stale-guide check that flags any guide not verified for six months or more.
- [ ] Search across country guides (Pagefind).
- [ ] Cloudflare Web Analytics (cookieless).

## Later

- [ ] **More detailed country areas when zoomed in.** Show regions inside each country (states, provinces and similar) at higher zoom, since some rules and restricted areas differ by region. Needs a region boundary source (for example Natural Earth admin-1), a decision on how region rules link to the country guide, and tiles beyond zoom 5, which goes together with the deeper-zoom item below.
- [x] Deeper map zoom: the basemap goes to zoom 7, served from a private R2 bucket through the Worker. Waiting on the one-time bucket setup in the README before it can be deployed.
- [ ] Higher-resolution country shapes (Natural Earth 10m) so the amber highlight follows the coastline at zoom 6 and 7.
- [ ] A "check my location" button.
- [ ] Printable country summary.
- [ ] Multilingual guides.
- [ ] Add a custom 404 page.
