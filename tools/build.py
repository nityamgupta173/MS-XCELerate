#!/usr/bin/env python3
"""Build the standalone site from the design-canvas sources in src/.

Each src/<Name>.dc.html becomes a plain HTML page at the repo root that runs on
js/dc-lite.js (bundled React, no network needed): fonts are self-hosted, canvas
image references (/_blob/<id>) point at assets/img/, and links between screens
point at the built pages.

Usage:  python3 tools/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

PAGES = {"Main.dc.html": "kiosk.html", "Phone.dc.html": "phone.html", "Tablet.dc.html": "tablet.html"}
BLOBS = {
    "f02902fd6f5f2d9430a882bd96820082": "assets/img/attract-hero.jpg",
    "6af0f345d19aea845fa37f1a1f2589cc": "assets/img/match-highway.jpg",
    "97301f3aa685d63b9cfe4d74d6a7040b": "assets/img/match-grand-vitara.jpg",
    "15696e640360e3c2f2cc9c84f8f7630f": "assets/img/match-victoris.jpg",
}

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<script>(function(){{var t=null;try{{t=new URLSearchParams(location.search).get("theme")||localStorage.getItem("msx-theme")}}catch(e){{}}if(t==="light")document.documentElement.setAttribute("data-theme","light")}})();</script>
<link rel="stylesheet" href="assets/fonts/fonts.css">
{helmet}
<style>
html,body{{margin:0;height:100%;overflow:hidden;background:var(--stage,#05080F)}}
#dc-viewport{{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden}}
#dc-stage{{flex:none;transform-origin:center center}}
#dc-all{{position:fixed;left:12px;bottom:12px;z-index:10;padding:6px 12px;border-radius:14px;background:var(--chip-bg,rgba(18,31,56,.85));color:var(--text-2,#C9D1DF);border:1px solid var(--line,transparent);font:600 12px 'Source Sans 3',sans-serif;text-decoration:none}}
#dc-all:hover{{color:var(--text,#F4F0E8)}}
</style>
</head>
<body>
<template id="dc-template">
{template}
</template>
<div id="dc-viewport"><div id="dc-stage"></div></div>
<a id="dc-all" href="index.html">All screens</a>
{script}
<script src="js/react.production.min.js"></script>
<script src="js/react-dom.production.min.js"></script>
<script src="js/dc-lite.js"></script>
</body>
</html>
"""


def fonts_css():
    out = ["/* Self-hosted from @fontsource (SIL Open Font License); see LICENSE.txt in each folder. */"]
    for fam in ("outfit", "source-sans-3"):
        for css in sorted((ROOT / "assets/fonts" / fam).glob("*.css")):
            out.append(css.read_text().replace("url(./files/", "url(" + fam + "/files/"))
    (ROOT / "assets/fonts/fonts.css").write_text("\n".join(out))


def build(src_name, out_name):
    text = (SRC / src_name).read_text()
    title = re.search(r"<title>(.*?)</title>", text, re.S).group(1)
    body = re.search(r"<x-dc>(.*?)</x-dc>", text, re.S).group(1)
    helmet = re.search(r"<helmet>(.*?)</helmet>", body, re.S)
    helmet_html = helmet.group(1) if helmet else ""
    # Google Fonts links are replaced by the self-hosted fonts.css
    helmet_html = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*', "", helmet_html)
    template = re.sub(r"<helmet>.*?</helmet>", "", body, flags=re.S).strip()
    script = re.search(r'(<script type="text/x-dc" data-dc-script.*?</script>)', text, re.S).group(1)
    page = SHELL.format(title=title, helmet=helmet_html.strip(), template=template, script=script)
    for src, dst in PAGES.items():
        page = page.replace('href="' + src + '"', 'href="' + dst + '"')
    for blob, path in BLOBS.items():
        page = page.replace("/_blob/" + blob, path)
    leftover = re.findall(r"/_blob/\w+|\.dc\.html", page)
    if leftover:
        raise SystemExit(f"{src_name}: unresolved references {leftover}")
    (ROOT / out_name).write_text(page)
    print("built", out_name)


if __name__ == "__main__":
    fonts_css()
    for s, o in PAGES.items():
        build(s, o)
