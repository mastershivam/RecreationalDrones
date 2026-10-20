# Sources of truth for airport and geo-zone rules

Written 2026-10-18. Read this before adding or changing an entry in `src/lib/airport-rules.ts` or a zone file.

## The problem

Most countries do not give a single "no drones within X km of an airport" number. The rule is a **geographical zone**: a map of areas (airport control zones, restricted areas) that each state must publish. Blog posts, forums and drone-app sites give conflicting distances (we saw 3, 5 and 8 km for the Netherlands and Spain), so they are not evidence. Our rule (DESIGN.md, Trust before flair) is that every figure shows its source, and a distance the authority does not give is `{ none: 'why' }`.

## What counts as a source, best first

1. **The legal text or the regulator's own page** that states a distance. Use this for `radiusMeters`. Examples we have read: the UK CAA aerodromes page, CASA's "Flying near airports" (5.5 km / 3 NM from a controlled airport, drones over 250 g).
2. **The state's official UAS geographical zones file** (the data behind its drone map). The EU requires every member state to publish its zones in a common digital format, EUROCAE ED-269, under [Article 15 of Regulation (EU) 2019/947](https://www.easa.europa.eu/en/newsroom-and-events/news/drone-guidance-extended-and-updated-support-safe-drone-operations-easa) (EASA ED Decision 2022/002/R). This is the best source for **where** zones are, and it beats any circle we could draw. It is only usable if its terms allow it (see Licences).
3. **The regulator's map** (Géoportail, D-Flight, DIPUL, ENAIRE and so on). Good for a link in the popup ("check the official map"), not for copying.
4. **Aggregators** such as [canfly.io](https://canfly.io/) (it says it normalises 16 of 31 EU/EEA states into ED-269) and [OpenAIP](https://groups.google.com/g/openaip) (community airspace data, said to be ODbL; its own licence page was not read). Useful for finding leads and for cross-checks. Never cite one as the authority.
5. **Everything else** (forums, drone blogs, DJI/app pages): leads only. A figure that only appears here does not go in the file.

## Where EU countries stand

EASA does not run an EU-wide feed. [Its page](https://www.easa.europa.eu/en/domains/drones-air-mobility/operating-drone/where-fly-easa-member-states-geo-zones) shows only a demonstration map for Ireland and Spain, in the newer ED-318 format, marked not for planning. Each national authority publishes its own.

The best survey is by Dronetrake (a commercial drone-operations platform), reported by [Unmanned Airspace on 2026-09-09, updated 2026-09-21](https://www.unmannedairspace.info/uncategorized/just-eleven-european-countries-publish-uas-geo-zone-information-in-correct-format/), with the live table at <https://dronetrake.com/press/zone-uas-europa?lang=en> (not read by us). It is secondary, so verify any country before relying on it. As reported:

| Status | Countries we have a guide for |
| --- | --- |
| Publishes an ED-269 file and allows use | Bulgaria, Czechia, Luxembourg, Sweden, Switzerland (the update cuts this group to seven countries and does not say which; Czechia's terms are described as permissive) |
| Publishes a file with **no terms at all** | Cyprus, Estonia, Finland, Ireland, Portugal. No terms means we may not assume we can copy it. |
| Publishes a file but **restricts it** | Austria, Denmark, Germany, Spain. Germany's DIPUL is CC BY-ND 4.0: reuse with credit, but no derivative works. |
| Netherlands | Official PDOK service withdrawn 2026-06-30; a leftover file is frozen at December 2025 and has no licence. |
| Publishes **no file** | Belgium, Croatia, Hungary, Italy (zones are in the AIP ENR 5.1/5.5/5.6 and in D-Flight, which needs an account), Lithuania, Poland |
| **Not in the survey** | France (Géoportail map by DGAC and IGN), Greece, Latvia, Malta, Romania, Slovakia, Slovenia |

Details worth keeping: Finland's Traficom file has 731 zones and downloads in one request with no registration (the page is Finnish only). Switzerland's file is refreshed daily; the interactive layer is `ch.bazl.einschraenkungen-drohnen` on map.geo.admin.ch, and the file also holds Liechtenstein's three zones. Luxembourg's is on [data.europa.eu](https://data.europa.eu/data/datasets/uas-geographical-zones-grand-duchy-of-luxembourg-zones-geographiques-uas-grand-duche-de-luxembourg) (the page is script-rendered; open it in a browser for the download link and licence).

## Countries outside the EU

| Country | Best source found | Notes |
| --- | --- | --- |
| United Kingdom | CAA aerodromes page for the rule; NATS publishes the UAS-relevant restrictions (ENR 5.1) as KMZ and AIXM on each AIRAC cycle | NATS lists "licence not specified" and warns against copying its maps. Ask NATS before using the files. |
| United States | FAA UAS Data Delivery System, "UAS FacilityMap Data" (altitude ceilings in controlled airspace, 14 CFR 107) | Public ArcGIS open-data hub, no authorisation implied. The FAA moved the UDDS and ADDS web URLs in July 2026 (notice AIS 26-01), so re-check links. |
| Canada | Transport Canada's "where to fly" page; the National Research Council's Drone Site Selection Tool; NAV Drone for permission | Not confirmed as an open dataset. Check open.canada.ca. |
| Australia | CASA "Flying near airports" (5.5 km from a controlled airport, over 250 g) | Distance is from the runway centreline, so a circle is an approximation. No open feed found. |
| Switzerland | See above: the daily ED-269 file | Cleanest source we found. |
| Norway | Luftfartstilsynet "No drone zones" (5 km from airports without the tower's permission, expected to become the control zone); the map is dronesoner.no | Page undated; read 2026-10-19. We draw a 5 km circle at every OurAirports airport, marked indicative. dronesoner.no's terms were not read. |
| Iceland | Samgöngustofa's drone map (kort.gis.is/mapview/?app=dronar) and AIP | The pages give no radius, so no circle. Pages are Icelandic only; the map was not opened. |
| Liechtenstein | FOCA's drone map, which the Landespolizei says applies there; FOCA's feed also holds Liechtenstein's three zones | No distance on the pages read, so no circle. The Liechtenstein authority's own page returned 403. |
| United Arab Emirates | The UAE Drones portal and its UTM Operator Manual v4.0 say flights are approved by the authority and show airspace in the app, with no distance or list | No circle. Read 2026-10-20. |
| Japan, Nepal, Thailand | Not researched in this pass | Existing entries use their authority's own pages. |

## Licences: what we found, not legal advice

- Do not copy a dataset with no stated licence. A missing licence is "all rights reserved" by default.
- CC BY-ND (Germany) forbids derivative works. Redrawing, merging or simplifying the zones may count. Ask DFS before using it.
- Show a link to the official map even where we cannot use its data. That is always allowed and is what a visitor needs.
- OurAirports (airport positions) is public domain and is what the existing zone files use.

## How to add or check a country's airport rule

1. Open the authority's own pages (the guide's `authorityUrl` is the start). Look for a stated distance or a named zone type.
2. Search the national aviation authority for "UAS geographical zones" or "geo zones" and for a downloadable file or WFS service.
3. Find the terms for any file: licence, or a statement that there are none.
4. Record the finding here (country, URL, format, licence, date read). Use a primary page, never an aggregator.
5. Then choose one of:
   - **A stated distance:** add the rule to `airport-rules.ts` with `ruleUrl` and run `npm run build:zones`.
   - **A usable zones file:** plan an ingest of the real polygons (see below).
   - **Neither:** write `{ none: 'why' }`, link the official map, and note it here.

## Pilot: official outlines loaded (2026-10-18)

`npm run build:official` reads each feed listed in `src/lib/official-feeds.ts` and writes `data/zones/<iso3>-official.geojson`. Loaded so far:

| Country | File | Terms | Notes |
| --- | --- | --- | --- |
| Switzerland | FOCA ED-269 JSON on data.geo.admin.ch (1,222 zones in the feed) | opendata.swiss "BY": free use, name the source | Includes nature and sensitive-site zones, not only airports. Upper limits above sea level are left out. |
| Luxembourg | DAC ED-269 JSON from drones.geoportail.lu | CC0 (data.public.lu) | 43 zones in the feed; ended or unrestricted ones are skipped. |

Outlines are rounded and thinned to about 20 m so Switzerland stays near 250 KB compressed. The authority's file stays the reference, and each file's note says so. Czechia is not loaded: its ED-318 file is 409 MB and its terms sit behind a link we have not read.

To add a country, add its feed to `official-feeds.ts` with the terms written down, run the script, and add a bounding box in `zones-data.test.ts`.

## Recommended next step (not built)

Drawing circles only works where an authority states a radius. For the many EU countries that publish an ED-269 zones file, a better build step would **ingest the file** into `data/zones/` as real polygons, like the existing hand-made zone files, with the file's URL, licence and fetch date in `meta`. Start with the countries whose terms clearly allow it (Czechia, Switzerland, Luxembourg, and Bulgaria and Sweden once their terms are confirmed), then ask the regulators in the "no terms" group for a licence. The zone schema now has an `airport-zone` kind (an outline, no radius) for this.

## Guide sources: Norway, Iceland, Liechtenstein (read 2026-10-19)

Guides follow each authority's own pages. Two things a reader of a search result could get wrong:
- A search summary said island.is says recreational drones need not be registered. The page it cited, `island.is/en/drone-registration`, returned 404, and Samgöngustofa's own pages (`island.is/dronareglur`, `/opni-flokkurinn`) say every operator registers, with one exemption (a toy under 250 g with no camera). We followed Samgöngustofa's pages.
- Liechtenstein has no national registration page that we could read. The Landespolizei says Swiss aviation law applies and names the civil aviation division of the Amt für Hochbau und Raumplanung, whose page (llv.li) returned 403 to us. FOCA's statements are what the guide rests on, and its level is marked provisional.
- Samgöngustofa's open-category page gives two different distances from uninvolved people for A2 (text 30 m or 5 m; table 50 m for drones under 4 kg). The guide says so and picks neither.

## Guide sources: United Arab Emirates (read 2026-10-20)

The usual official pages would not give the rules: u.ae returned 404, gcaa.gov.ae loaded only script placeholders and an empty list of regulations, and the Dubai Civil Aviation Authority's site (dcaa.gov.ae) was a script-only shell. Blog posts and travel sites disagreed on every fee (AED 100, 120, 200 or 250) and on whether small drones are exempt, and one said recreational flying in Dubai is suspended, so none of them is used. What the guide rests on is the **UTM Operator Manual, version 4.0**, linked from the UAE Drones portal (drones.gov.ae/Content/User-Manual.pdf, 27 MB, 141 pages, no date). The fetch tool refuses files over 10 MB, so we downloaded it and read the text with macOS's PDF library. It describes the app and website, so the guide is only as good as that: the fees (AED 100 pilot, AED 200 per drone every 2 years), the 5 kg limit on a recreational drone, the mandatory tracker from e&, and the recreational flight-request limits (500 m radius, 400 ft, same day, daylight, VLOS, no charge) are the manual's. The regulation behind them was not found. The level (3) comes from per-flight approval and is provisional because Dubai could not be read.

## Open questions

- Which seven countries does the 2026-09-21 update count as "file and a licence", exactly? Read the Dronetrake table.
- Does France publish the Géoportail restriction layer as downloadable open data (data.gouv.fr)?
- What terms apply to the NATS UAS files, and to Canada's NRC layers?
- Do the EU "no terms" files (Finland, Estonia, Portugal, Cyprus, Ireland) become usable if the regulator is asked? Finland's is the easiest to ask about.

## Weather

Read 2026-10-18. Used by `src/lib/weather.ts`.

- **Data:** [Open-Meteo](https://open-meteo.com/en/terms), called from our Worker (`/weather`) with no key, never from the visitor's browser. Cloudflare caches each rounded point for 10 minutes, since the free limits are shared by everyone calling from Cloudflare's addresses. The free API is for **non-commercial use only** (under 10,000 calls a day, 5,000 an hour), and the data is CC BY 4.0, so every result shows "Weather data by Open-Meteo.com" with a link. If the site ever carries ads or paid features, buy a plan or switch source.
- **Wind note at 38 km/h:** the DJI Mini 4 Pro's flight manual, section 2.8 "Flight environment restrictions", lists wind speed exceeding 10.7 m/s (38.5 km/h) as a prohibited environment (UAS Flight Manual, [DJI](https://dl.djicdn.com/downloads/DJI_Mini_4_Pro/UAS_Flight%20Manual_DJI_Model_DJI_Mini_4_Pro_EN.pdf), read 2026-10-20; the PDF's text was extracted locally). Smaller and older drones are rated lower, so the note says "many small drones" and points to the owner's manual.
- **Temperature note outside -10 to 40 °C:** same section: flyable temperature range -10 °C to 40 °C.
- **Rain note:** any precipitation above 0 mm. The same section lists "Rain, snow, icing, and fog conditions" as prohibited for the Mini 4 Pro. One model is the only source read, so the note says "some makers, such as DJI" and points to the owner's manual, not "most drones".
- **Visibility note under 5 km:** SERA.5001, Table S5-1: flight visibility of 5 km for VFR flight below 3050 m AMSL (and at or below 900 m, classes A to E; F and G allow 1,500 m in daylight at 140 kt or less). Read on the [UK CAA regulatory library](https://regulatorylibrary.caa.co.uk/923-2012/Content/Regs/01250_SERA5001_VMC_visibility_and_distance_from_cloud_minima.htm) (source line "SI 2021 No. 10", the UK's retained text) on 2026-10-20; **the EU original on EUR-Lex returned an empty page and is unread**, though EASA's Easy Access Rules show the same figure in a search snippet. It is a rule for crewed aircraft, used only as a rough guide: drone rules give no number, only that the drone stays in sight, so the note says so.

*Status of this file: built from web searches and one fetched survey article on 2026-10-18. The Dronetrake table, the Luxembourg dataset page and the EASA page's country list were not read directly. Re-verify before relying on a row.*
