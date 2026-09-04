import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://ttizdyjfumqgnzzfpjrx.supabase.co"
LOVABLE_URL = "https://alcharmy.lovable.app"

def check(name, url):
    try:
        req = urllib.request.Request(
            url,
            method="GET",
            headers={"User-Agent": "ALCHARMY-STATUS/1.0"}
        )

        with urllib.request.urlopen(req, timeout=8) as r:
            return {
                "service": name,
                "status": "ONLINE",
                "http_status": r.status
            }

    except urllib.error.HTTPError as e:
        return {
            "service": name,
            "status": "REACHABLE",
            "http_status": e.code
        }

    except Exception as e:
        return {
            "service": name,
            "status": "OFFLINE",
            "error": type(e).__name__
        }

supabase = check(
    "SUPABASE",
    SUPABASE_URL + "/rest/v1/"
)

lovable = check(
    "LOVABLE",
    LOVABLE_URL
)

results = {
    "system": "ALCHARMY",
    "supabase": supabase,
    "lovable": lovable
}

results["connection"] = {
    "status": (
        "SERVICES_REACHABLE"
        if supabase["status"] in ("ONLINE", "REACHABLE")
        and lovable["status"] in ("ONLINE", "REACHABLE")
        else "NOT_READY"
    )
}

print(json.dumps(results, indent=2))
