import json
import urllib.request

SATELLITE = 1002
TARGET_FREQ = 236_997_000

url = (
    "https://db.satnogs.org/api/transmitters/"
    f"?satellite__norad_cat_id={SATELLITE}"
)

print("=" * 60)
print("LES-1 RECEIVE-ONLY MONITOR")
print("=" * 60)
print(f"NORAD ID : {SATELLITE}")
print("Target   : 236.997 MHz USB")
print("Mode     : RECEIVE ONLY")
print()

try:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ALCHEMY-LES1-Monitor/1.0"}
    )

    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.load(response)

    if not data:
        print("No public transmitter records returned.")
    else:
        for tx in data:
            freq = tx.get("downlink_low")
            mode = tx.get("mode")

            print("Transmitter:")
            print("  ID       :", tx.get("uuid"))
            print("  Frequency:", freq)
            print("  Mode     :", mode)
            print("  Status   :", tx.get("status"))
            print()

except Exception as e:
    print("Connection error:", e)
