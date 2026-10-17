# Prints, as JSON, every node and way tagged sport=model_aerodrome in an OpenStreetMap extract (.osm.pbf).
# A way is given the average position of its nodes. Run by build-model-fields.ts through:
#   uvx --from osmium python scripts/osm-model-fields.py <file.osm.pbf>
# shortcut: nodes and ways only; a field mapped as a relation (a multipolygon) is skipped. Add them if one turns up.
import json
import sys

import osmium

rows = []
fields = (
    osmium.FileProcessor(sys.argv[1], osmium.osm.NODE | osmium.osm.WAY)
    .with_locations()
    .with_filter(osmium.filter.TagFilter(("sport", "model_aerodrome")))
)
for o in fields:
    if o.is_node():
        lon, lat = o.location.lon, o.location.lat
    else:
        points = [(n.lon, n.lat) for n in o.nodes if n.location.valid()]
        if not points:
            continue
        lon = sum(p[0] for p in points) / len(points)
        lat = sum(p[1] for p in points) / len(points)
    row = {"id": ("node/" if o.is_node() else "way/") + str(o.id), "lon": lon, "lat": lat}
    for key in ("name", "access"):
        if o.tags.get(key):
            row[key] = o.tags[key]
    rows.append(row)
json.dump(rows, sys.stdout)
