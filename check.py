#!/usr/bin/env python3
"""Check one Liverpool brief before it is published. Usage: python3 check.py 2026-11-08

Stops with a list of problems if the brief breaks BRIEF.md or would break the
page. If it passes, adds the date to briefs/index.json. Chrome proves the page renders.
"""
import datetime
import functools
import http.server
import json
import pathlib
import re
import shutil
import subprocess
import sys
import threading

ROOT = pathlib.Path(__file__).parent.resolve()
TAGS = {"LFC", "PL", "UCL", "LaLiga", "SerieA"}
DAYTYPES = ["matchday", "postmatch", "talking", "window", "quiet"]
EVENT_TYPES = {"goal", "pen", "og", "red", "yellow", "var", "sub"}
MOVES = {"in", "out", "loan in", "loan out", "contract"}
STATUSES = {"hot", "warm", "cooling", "done", "dead"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
problems = []


def need(cond, msg):
    if not cond:
        problems.append(msg)


def text(where, value, limit=None, empty_ok=False):
    if empty_ok and value == "":
        return
    need(isinstance(value, str) and value.strip(), f"{where}: missing text")
    if isinstance(value, str):
        need("—" not in value, f"{where}: contains an em dash")
        if limit:
            need(len(value) <= limit, f"{where}: {len(value)} characters, limit {limit}")


def url(where, value, host=None):
    v = str(value or "")
    need(v.startswith("https://"), f"{where}: url must start with https://")
    if host:
        need(v.startswith("https://" + host + "/"), f"{where}: url must be on {host}")


def story(where, s, poster):
    need(s.get("tag") in TAGS, f"{where}: tag must be one of {sorted(TAGS)}")
    text(f"{where} headline", s.get("headline"), 34 if poster else 70)
    text(f"{where} summary", s.get("summary"), 170)
    src = s.get("source") or {}
    text(f"{where} source name", src.get("name"))
    text(f"{where} source date", src.get("date"), 12)
    url(f"{where} source", src.get("url"))
    r = s.get("read") or {}
    for k in ("what", "context", "take"):
        text(f"{where} read.{k}", r.get(k), 600)
    if poster:
        big = s.get("big", "")
        need(isinstance(big, str), f"{where}: big must be text (empty string if none)")
        if big:
            text(f"{where} big", big, 7)
        need(len(str(s.get("headline", "")).split()) >= 3, f"{where}: poster headline must say what happened in at least 3 words")


def goals_from(events):
    us = them = 0
    for e in events:
        t, side = e.get("type"), e.get("side")
        if t in ("goal", "pen"):
            us += side == "lfc"
            them += side == "opp"
        elif t == "og":  # an own goal counts for the other side
            us += side == "opp"
            them += side == "lfc"
    return us, them


def previous(date):
    dates = json.loads((ROOT / "briefs" / "index.json").read_text())
    earlier = sorted(d for d in dates if d < date)
    if not earlier:
        return None, None
    d = earlier[-1]
    try:
        return d, json.loads((ROOT / "briefs" / f"{d}.json").read_text())
    except (OSError, ValueError):
        return d, None


def check(date):
    b = json.loads((ROOT / "briefs" / f"{date}.json").read_text())
    day = datetime.date.fromisoformat(date)
    need(b.get("date") == date, "date does not match the filename")
    need("sample" not in b, "remove the sample flag")
    need(b.get("dayLabel") == f"{day:%A} {day.day} {day:%B %Y}", "dayLabel does not match the date")
    dt = b.get("dayType")
    need(dt in DAYTYPES, f"dayType must be one of {DAYTYPES}")
    need(isinstance(b.get("window"), bool), "window must be true or false")
    text("verdict", b.get("verdict"), 90)
    big = b.get("big") or {}
    text("big value", big.get("value"), 7)
    text("big label", big.get("label"), 40)

    posters, stories = b.get("posters") or [], b.get("stories") or []
    need(1 <= len(posters) <= 3, "use 1 to 3 posters")
    need(len(posters) + len(stories) <= 8, "8 stories at most, posters included")
    for i, s in enumerate(posters):
        story(f"poster {i + 1}", s, True)
    for i, s in enumerate(stories):
        story(f"story {i + 1}", s, False)
    heads = [str(s.get("headline", "")).strip().lower() for s in posters + stories]
    need(len(heads) == len(set(heads)), "two stories have the same headline")
    europe = [s for s in posters + stories if s.get("tag") in TAGS - {"LFC"}]
    need(len(europe) <= 5, "Around Europe: 5 stories at most, only the noteworthy ones")

    lm = b.get("lastMatch")
    need(bool(lm) or dt != "postmatch", "dayType postmatch needs lastMatch")
    if lm:
        text("lastMatch opp", lm.get("opp"), 24)
        text("lastMatch comp", lm.get("comp"), 30)
        need(lm.get("venue") in ("H", "A", "N"), "lastMatch venue must be H, A or N")
        need(isinstance(lm.get("us"), int) and isinstance(lm.get("them"), int), "lastMatch us and them must be whole numbers")
        text("lastMatch date", lm.get("date"), 12)
        ev = lm.get("events") or []
        for i, e in enumerate(ev):
            text(f"event {i + 1} min", e.get("min"), 6)
            need(e.get("type") in EVENT_TYPES, f"event {i + 1}: type must be one of {sorted(EVENT_TYPES)}")
            need(e.get("side") in ("lfc", "opp"), f"event {i + 1}: side must be lfc or opp")
            text(f"event {i + 1} text", e.get("text"), 60)
        need(goals_from(ev) == (lm.get("us"), lm.get("them")),
             f"lastMatch: goals in events give {goals_from(ev)}, score says ({lm.get('us')}, {lm.get('them')})")
        url("lastMatch source", (lm.get("source") or {}).get("url"))

    nm = b.get("nextMatch")
    if nm:
        text("nextMatch opp", nm.get("opp"), 24)
        text("nextMatch comp", nm.get("comp"), 30)
        need(nm.get("venue") in ("H", "A", "N"), "nextMatch venue must be H, A or N")
        ko = str(nm.get("kickoff", ""))
        need(re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$", ko), "nextMatch kickoff must be UTC like 2026-11-09T16:30:00Z")
        if re.match(r"^\d{4}-\d{2}-\d{2}T", ko):
            kd = datetime.date.fromisoformat(ko[:10])
            need(day <= kd <= day + datetime.timedelta(days=21), "nextMatch must be today or within 21 days")
            need((kd == day) == (dt == "matchday"), "dayType matchday exactly when nextMatch kicks off today")
        text("nextMatch teamNews", nm.get("teamNews"), 150)
        xi = nm.get("likelyXI")
        need(isinstance(xi, list) and len(xi) in (0, 11), "likelyXI must be 11 names or an empty list")
        url("nextMatch source", (nm.get("source") or {}).get("url"))
    else:
        need(dt != "matchday", "dayType matchday needs nextMatch")

    fx = b.get("fixtures") or []
    need(len(fx) <= 3, "fixtures: next 3 at most")
    for i, f in enumerate(fx):
        text(f"fixture {i + 1} opp", f.get("opp"), 24)
        text(f"fixture {i + 1} comp", f.get("comp"), 30)
        need(f.get("venue") in ("H", "A", "N"), f"fixture {i + 1}: venue must be H, A or N")
        text(f"fixture {i + 1} date", f.get("date"), 12)
        text(f"fixture {i + 1} time", f.get("time"), 8)

    tb = b.get("table") or {}
    rows = tb.get("rows") or []
    need(6 <= len(rows) <= 7, "table: top 6, plus Liverpool if outside")
    need(any("liverpool" in str(r.get("team", "")).lower() for r in rows), "table must include Liverpool")
    for i, r in enumerate(rows):
        need(all(isinstance(r.get(k), int) for k in ("pos", "played", "gd", "pts")), f"table row {i + 1}: pos, played, gd, pts must be whole numbers")
        text(f"table row {i + 1} team", r.get("team"), 24)
    pts = [r.get("pts", 0) for r in rows[:6] if isinstance(r.get("pts"), int)]
    need(pts == sorted(pts, reverse=True), "table rows must be in order")
    text("table asOf", tb.get("asOf"), 12)
    url("table source", (tb.get("source") or {}).get("url"))

    for i, p in enumerate(b.get("injuries") or []):
        text(f"injury {i + 1} player", p.get("player"), 30)
        text(f"injury {i + 1} issue", p.get("issue"), 40)
        need(p.get("status") in ("out", "doubt", "back"), f"injury {i + 1}: status must be out, doubt or back")
        text(f"injury {i + 1} expected", p.get("expected"), 40)
        url(f"injury {i + 1} source", (p.get("source") or {}).get("url"))

    tr = b.get("tracker") or []
    ids = [t.get("id") for t in tr]
    need(len(ids) == len(set(ids)), "tracker: two items share an id")
    for i, t in enumerate(tr):
        w = f"tracker {t.get('id') or i + 1}"
        need(re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", str(t.get("id", ""))), f"{w}: id must be lower case words joined by hyphens")
        text(f"{w} player", t.get("player"), 40)
        text(f"{w} position", t.get("position"), 24)
        text(f"{w} club", t.get("club"), 30)
        need(t.get("move") in MOVES, f"{w}: move must be one of {sorted(MOVES)}")
        need(t.get("status") in STATUSES, f"{w}: status must be one of {sorted(STATUSES)}")
        need(t.get("tier") in (1, 2, 3), f"{w}: tier must be 1, 2 or 3")
        rb = t.get("reportedBy") or []
        need(len(rb) >= 1, f"{w}: needs at least one source in reportedBy")
        for r in rb:
            text(f"{w} outlet", r.get("outlet"), 40)
            need(DATE_RE.match(str(r.get("date", ""))), f"{w}: reportedBy date must be YYYY-MM-DD")
            url(f"{w} reportedBy", r.get("url"))
        if t.get("tier") == 3:
            need(len({str(r.get("outlet", "")).lower() for r in rb}) >= 2, f"{w}: a Tier 3 rumour needs two different outlets")
        for k in ("firstSeen", "lastChange"):
            need(DATE_RE.match(str(t.get(k, ""))) and str(t.get(k)) <= date, f"{w}: {k} must be a date no later than today")
        if DATE_RE.match(str(t.get("lastChange", ""))):
            stale = (day - datetime.date.fromisoformat(t["lastChange"])).days > 14
            need(not stale or t.get("status") == "dead", f"{w}: no change for over 14 days, so status must be dead")
        text(f"{w} update", t.get("update"), 170)

    pd, prev = previous(date)
    if prev is not None:
        old = {t.get("id"): t for t in prev.get("tracker") or []}
        now = {t.get("id"): t for t in tr}
        for i, t in old.items():
            if t.get("status") not in ("done", "dead"):
                need(i in now, f"tracker: {i} was open on {pd} and must be carried forward (or closed as done or dead)")
            elif i in now:
                problems.append(f"tracker: {i} was closed on {pd}, so drop it today")
        for i, t in now.items():
            if i in old:
                need(t.get("firstSeen") == old[i].get("firstSeen"), f"tracker: {i} firstSeen must not change")
                if t.get("tier", 9) < old[i].get("tier", 9):
                    old_urls = {r.get("url") for r in old[i].get("reportedBy") or []}
                    need(any(r.get("url") not in old_urls for r in t.get("reportedBy") or []),
                         f"tracker: {i} tier went up without a new source")

    talking = b.get("talking") or []
    need(len(talking) <= 3, "talking: 3 at most")
    for i, t in enumerate(talking):
        w = f"talking {i + 1}"
        text(f"{w} headline", t.get("headline"), 70)
        text(f"{w} summary", t.get("summary"), 170)
        text(f"{w} for", t.get("for"), 200)
        text(f"{w} against", t.get("against"), 200)
        text(f"{w} take", t.get("take"), 300)
        need(isinstance(t.get("call"), str), f"{w}: call must be text (empty string if none)")
        text(f"{w} call", t.get("call"), 16, empty_ok=True)
        url(f"{w} source", (t.get("source") or {}).get("url"))
    need(dt != "talking" or any(t.get("call") for t in talking), "dayType talking needs a talking item with a call")
    need(dt != "window" or b.get("window") is True, "dayType window needs window: true")

    xl = b.get("xlist") or []
    need(len(xl) <= 6, "xlist: 6 at most")
    for i, x in enumerate(xl):
        w = f"xlist {i + 1}"
        need(str(x.get("handle", "")).startswith("@"), f"{w}: handle must start with @")
        need(x.get("kind") in ("take", "transfer", "performance"), f"{w}: kind must be take, transfer or performance")
        text(f"{w} headline", x.get("headline"), 70)
        text(f"{w} summary", x.get("summary"), 190)
        need(x.get("trust") in ("Confirmed", "Plausible", "Opinion", "Unverified"), f"{w}: trust must be Confirmed, Plausible, Opinion or Unverified")
        th = x.get("thread") or {}
        text(f"{w} thread date", th.get("date"), 12)
        url(f"{w} thread", th.get("url"), "x.com")

    mood = b.get("mood")
    if mood is not None:
        need(mood.get("word") in ("positive", "mixed", "frustrated", "angry"), "mood: word must be positive, mixed, frustrated or angry")
        sp = mood.get("split") or {}
        parts = [sp.get(k) for k in ("positive", "mixed", "negative")]
        need(all(isinstance(v, int) and 0 <= v <= 100 for v in parts), "mood split: positive, mixed and negative must be whole numbers")
        if all(isinstance(v, int) for v in parts):
            need(sum(parts) == 100, f"mood split: adds up to {sum(parts)}, must be 100")
        text("mood basis", mood.get("basis"), 90)
        th = mood.get("themes") or []
        need(2 <= len(th) <= 5, "mood themes: 2 to 5")
        for i, t in enumerate(th):
            text(f"mood theme {i + 1}", t, 140)
        qs = mood.get("quotes") or []
        need(len(qs) <= 8, "mood quotes: 8 at most")
        for i, q in enumerate(qs):
            w = f"mood quote {i + 1}"
            need(q.get("about") in ("player", "team", "manager", "board"), f"{w}: about must be player, team, manager or board")
            text(f"{w} subject", q.get("subject"), 30)
            need(q.get("kind") in ("opinion", "insight", "claim"), f"{w}: kind must be opinion, insight or claim")
            text(f"{w} text", q.get("text"), 200)
            need(len(str(q.get("text", "")).split()) <= 35, f"{w}: more than 35 words")
            need(str(q.get("handle", "")).startswith(("@", "u/")), f"{w}: handle must start with @ or u/")
            text(f"{w} handle", q.get("handle"), 40)
            u = str(q.get("url") or "")
            need(u.startswith(("https://x.com/", "https://www.reddit.com/", "https://reddit.com/")), f"{w}: url must be on x.com or reddit.com")


def render(date):
    chrome = next(filter(None, map(shutil.which, ["google-chrome", "chromium"])), None) \
        or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    page = f"http://127.0.0.1:{server.server_port}/index.html?d={date}"
    try:
        out = subprocess.run(
            [chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=375,812",
             "--virtual-time-budget=4000", "--dump-dom", page],
            capture_output=True, text=True, timeout=60).stdout
    finally:
        server.shutdown()
    need('class="verdict"' in out, "page did not render the verdict")
    need('class="tracker' in out, "page did not render the rumour tracker")
    need('data-opening="' in out, "page did not start its opening world")
    need('class="err"' not in out, "page showed its error message")
    if json.loads((ROOT / "briefs" / f"{date}.json").read_text()).get("mood"):
        need('class="mood"' in out, "page did not render the fan mood")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    date = sys.argv[1]
    datetime.date.fromisoformat(date)
    index_path = ROOT / "briefs" / "index.json"
    original = index_path.read_text()
    try:
        check(date)
    except Exception as e:
        need(False, f"brief could not be read: {e}")
    if not problems:
        dates = sorted(set(json.loads(original)) | {date}, reverse=True)
        index_path.write_text(json.dumps(dates))
        render(date)
    if problems:
        index_path.write_text(original)
        print("FAILED")
        print("\n".join(f"- {p}" for p in problems))
        sys.exit(1)
    print("PASSED")


main()
