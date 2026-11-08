# Red Brief

A daily Liverpool FC brief: news, graded transfer rumours, injuries, fixtures, talking points and the wider European headlines, published at about 07:30 UK.

Page: https://mrbam-codes.github.io/lfc-brief/

How it works: a scheduled Claude routine writes `briefs/YYYY-MM-DD.json` following `BRIEF.md`, checks it with `check.py`, and pushes it to the `briefs` branch. A GitHub Actions workflow on locked `main` takes only checked brief files from that branch and publishes them with main's own page code. Sources are linked on every item; Claude's takes are opinion.
