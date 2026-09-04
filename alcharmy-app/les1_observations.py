import json
import urllib.request
from datetime import datetime

NORAD = 1002

url = (
    "https://network.satnogs.org/api/observations/"
    f"?norad_cat_id={NORAD}"
    "&status=good"
    "&limit=20"
)

print("=" * 60)
print("ALCHEMY / LES-1 PUBLIC RECEIVE MONITOR")
print("=" * 60)
print("Satellite : LES-1")
print("NORAD     :", NORAD)
print("Frequency : 236.997 MHz")
print("Mode      : USB")
print("Operation : RECEIVE ONLY")
print()

try:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ALCHEMY-LES1-Monitor/1.0"}
    )

    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.load(r)

    if not data:
        print("No public LES-1 observations found.")
    else:
        print("PUBLIC OBSERVATIONS FOUND:", len(data))
        print()

        for obs in data:
            print("Observation ID :", obs.get("id"))
            print("Station        :", obs.get("station_name"))
            print("Start          :", obs.get("start"))
            print("End            :", obs.get("end"))
            print("Status         :", obs.get("status"))
            print("-" * 60)

except Exception as e:
    print("Connection error:", e)
