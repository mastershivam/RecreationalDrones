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

## Open questions

- Which seven countries does the 2026-09-21 update count as "file and a licence", exactly? Read the Dronetrake table.
- Does France publish the Géoportail restriction layer as downloadable open data (data.gouv.fr)?
- What terms apply to the NATS UAS files, and to Canada's NRC layers?
- Do the EU "no terms" files (Finland, Estonia, Portugal, Cyprus, Ireland) become usable if the regulator is asked? Finland's is the easiest to ask about.

*Status of this file: built from web searches and one fetched survey article on 2026-10-18. The Dronetrake table, the Luxembourg dataset page and the EASA page's country list were not read directly. Re-verify before relying on a row.*
