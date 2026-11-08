"""Print the last 3 briefs' headlines and yesterday's rumour tracker, so a run
can avoid repeats and carry every open rumour forward.

Usage: python3 recent.py YYYY-MM-DD
Prints names only, never links: addresses taken from a file make a routine's
WebFetch stall for 5 minutes waiting for approval.
"""
import json, os, sys

day = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
dates = json.load(open(os.path.join(here, "briefs", "index.json")))
earlier = sorted(d for d in dates if d < day)[-3:]
if not earlier:
    print("No earlier briefs. Start the tracker fresh.")
loaded = {}
for d in reversed(earlier):
    try:
        loaded[d] = json.load(open(os.path.join(here, "briefs", d + ".json")))
    except (OSError, ValueError):
        print(d + ": could not read")
        continue
    b = loaded[d]
    print(d + ":")
    for s in list(b.get("posters", [])) + list(b.get("stories", [])) + list(b.get("talking", [])):
        name = (s.get("source") or {}).get("name", "")
        print("- [" + s.get("tag", "Talking") + "] " + s.get("headline", "") + (" (" + name + ")" if name else ""))
if earlier and earlier[-1] in loaded:
    last = earlier[-1]
    open_items = [t for t in loaded[last].get("tracker", []) if t.get("status") not in ("done", "dead")]
    print("\nTracker to carry forward from " + last + " (" + str(len(open_items)) + " open):")
    for t in open_items:
        outlets = ", ".join(r.get("outlet", "") for r in t.get("reportedBy", []))
        print("- id=" + t.get("id", "") + " | " + t.get("player", "") + " (" + t.get("position", "") + ", " + t.get("club", "") + ") | "
              + t.get("move", "") + " | status " + t.get("status", "") + " | tier " + str(t.get("tier", "")) + " | first seen "
              + t.get("firstSeen", "") + " | last change " + t.get("lastChange", "") + " | outlets: " + outlets)
