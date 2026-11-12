#!/usr/bin/env python3
"""Build the seasand.ai blog and keep the site navigation in step.

Sources (in _blog/, which GitHub Pages does not publish):
  site.json        site URL, footer line, contact, and the ONE navigation list for every page
  posts.json       one entry per post (slug, title, date, author, role, dek (bold), dek1b, dek2 (italic), description, image, published)
  posts/<slug>.html  the post body (HTML fragment)
  pages/about.html the About page body ("Who's building it", moved from the home page)
  partials/        blog.css, the two lockups, the shore wave

Writes:
  blog/index.html              the index, newest first
  blog/<slug>/index.html       one page per published post, with share links and Older / Newer
  about/index.html             the About page (Who's building it)
  blog/feed.xml                RSS for the published posts
  sitemap.xml                  home + blog pages
  index.html (home)            only the nav list between <!-- nav:start --> and <!-- nav:end -->

Add a post: write posts/<slug>.html, add its entry to posts.json, run `python3 _blog/build.py`, commit.
Add a nav item: add it to site.json "nav" and run the build; home and every blog page pick it up.
"""
import html, json, os, re, sys
from datetime import date, datetime, timezone
from email.utils import format_datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def read(*p):
    with open(os.path.join(HERE, *p), encoding="utf-8") as f:
        return f.read()


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ".", exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)
    print("wrote", path)


SITE = json.loads(read("site.json"))
BASE = SITE["site"].rstrip("/")
CSS = read("partials", "blog.css")
LOCKUP_SEA = read("partials", "lockup-sea.svg")
LOCKUP_FOOT = read("partials", "lockup-foot.svg")
SHORE = read("partials", "shore.svg")

posts = [p for p in json.loads(read("posts.json")) if p.get("published", True)]
posts.sort(key=lambda p: p["date"], reverse=True)          # newest first
slugs = [p["slug"] for p in posts]
if len(set(slugs)) != len(slugs):
    sys.exit("duplicate slug in posts.json")
for p in posts:
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", p["slug"]):
        sys.exit(f"bad slug: {p['slug']}")

e = lambda s: html.escape(s, quote=True)
url_of = lambda p: f"{BASE}/blog/{p['slug']}/"


def fmt(d):
    return datetime.strptime(d, "%Y-%m-%d").strftime("%b %-d, %Y")


def nav(current=None, home=False):
    items = []
    for n in SITE["nav"]:
        href = n["home"] if home else n["href"]
        cur = ' aria-current="page"' if current and n.get("section") == current else ""
        items.append(f'<li><a href="{e(href)}"{cur}>{e(n["label"])}</a></li>')
    return "\n          ".join(items)


def share(p, cls=""):
    u = e(url_of(p))
    from urllib.parse import quote
    q = quote(url_of(p), safe="")
    return f"""<div class="share {cls}" aria-label="Share this post">
          <span class="lbl">Share</span>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url={q}" target="_blank" rel="noopener">LinkedIn</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u={q}" target="_blank" rel="noopener">Facebook</a>
          <button type="button" data-copy="{u}">Copy link</button>
        </div>"""


def page(*, title, canonical, description, hero, main, og=None, current="blog"):
    og = og or {}
    meta = [
        f'<link rel="canonical" href="{e(canonical)}">',
        f'<meta name="description" content="{e(description)}">',
        f'<meta property="og:site_name" content="{e(SITE["name"])}">',
        f'<meta property="og:type" content="{og.get("type", "website")}">',
        f'<meta property="og:title" content="{e(og.get("title", title))}">',
        f'<meta property="og:description" content="{e(description)}">',
        f'<meta property="og:url" content="{e(canonical)}">',
    ]
    if og.get("image"):
        meta += [
            f'<meta property="og:image" content="{e(og["image"])}">',
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="627">',
            '<meta name="twitter:card" content="summary_large_image">',
        ]
    if og.get("published"):
        meta.append(f'<meta property="article:published_time" content="{og["published"]}">')
    meta = "\n".join(meta)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
{meta}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate" type="application/rss+xml" title="SeaSand Blog" href="/blog/feed.xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;500&family=Noto+Sans+JP:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
{CSS}</style>
</head>
<body>
<!-- Generated by _blog/build.py. Edit the sources in _blog/, not this file. -->
<div class="sea">
  <div class="wrap">
    <header class="top">
      <a href="/" aria-label="SeaSand, home">{LOCKUP_SEA}</a>
      <nav aria-label="Sections">
        <ul>
          {nav(current=current)}
        </ul>
      </nav>
    </header>
    <div class="hero">
      {hero}
    </div>
  </div>
  {SHORE}
</div>

<main class="part">
{main}
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="left">{LOCKUP_FOOT}<span>{SITE["footer"]}</span></div>
    <span class="addr-small">{e(SITE["contact"])}</span>
  </div>
</footer>

<script>
document.addEventListener('click', function (ev) {{
  var b = ev.target.closest('[data-copy]'); if (!b) return;
  var text = b.getAttribute('data-copy'), label = b.textContent;
  function done(ok) {{ b.textContent = ok ? 'Copied' : text; setTimeout(function () {{ b.textContent = label; }}, 2000); }}
  try {{ navigator.clipboard.writeText(text).then(function () {{ done(true); }}, function () {{ done(false); }}); }} catch (err) {{ done(false); }}
}});
</script>
</body>
</html>
"""


def build_index():
    rows = "".join(f"""
        <li class="post-row"><a href="/blog/{p['slug']}/">
          <p class="date"><time datetime="{p['date']}">{fmt(p['date'])}</time></p>
          <span class="txt"><span class="t">{e(p['title'])}</span><span class="d">{e(p['dek'])}</span></span>
          <span class="arrow" aria-hidden="true">&#8594;</span>
        </a></li>""" for p in posts)
    main = f"""  <div class="wrap">
    <div class="rail"><p class="kicker">All posts</p></div>
    <div class="main"><ul class="posts">{rows}
    </ul></div>
  </div>"""
    write("blog/index.html", page(
        title="Blog · SeaSand",
        canonical=f"{BASE}/blog/",
        description="Writing from SeaSand.",
        hero='<p class="where">SeaSand</p>\n      <h1>Blog</h1>',
        main=main,
        og={"title": "SeaSand Blog", "image": f"{BASE}/blog/{posts[0]['slug']}/{posts[0]['image']}" if posts and posts[0].get("image") else None},
    ))


def build_post(i):
    p = posts[i]
    newer = posts[i - 1] if i > 0 else None
    older = posts[i + 1] if i + 1 < len(posts) else None
    body = read("posts", f"{p['slug']}.html")
    hero = (f'<p class="where"><a href="/blog/">Blog</a><span aria-hidden="true">·</span>'
            f'<time datetime="{p["date"]}">{fmt(p["date"])}</time></p>\n'
            f'      <h1>{e(p["title"])}</h1>\n      <p class="dek"><strong>{e(p["dek"])}</strong>'
            + (f' {e(p["dek1b"])}' if p.get("dek1b") else '') + '</p>')
    if p.get("dek2"):
        hero += f'\n      <p class="dek2">{e(p["dek2"])}</p>'
    older_html = (f'<a href="/blog/{older["slug"]}/"><span class="k">&#8592; Older</span><span class="t">{e(older["title"])}</span></a>'
                  if older else '<span class="none">This is the first post.</span>')
    newer_html = (f'<a class="newer" href="/blog/{newer["slug"]}/"><span class="k">Newer &#8594;</span><span class="t">{e(newer["title"])}</span></a>'
                  if newer else '<span class="none newer">Newer posts will appear here.</span>')
    main = f"""  <div class="wrap">
    <div class="rail"><div class="stick"><p class="kicker">{e(p['author'])}</p><p class="who">{e(p.get('role', ''))}</p>
        {share(p)}
    </div></div>
    <div class="main">
      <article class="prose">
{body}
      </article>
      <div class="post-end">
        {share(p)}
        <nav class="pn" aria-label="More posts">
          {older_html}
          {newer_html}
        </nav>
        <a class="allposts" href="/blog/">&#8592; All posts</a>
      </div>
    </div>
  </div>"""
    image = f"{url_of(p)}{p['image']}" if p.get("image") else None
    write(f"blog/{p['slug']}/index.html", page(
        title=f"{p['title']} · SeaSand",
        canonical=url_of(p),
        description=p.get("description", p["dek"]),
        hero=hero,
        main=main,
        og={"type": "article", "title": p["title"], "image": image, "published": p["date"]},
    ))


def build_about():
    body = read("pages", "about.html")
    main = f"""  <div class="wrap">
    <div class="rail"><p class="kicker">Founder</p></div>
    <div class="main founder">
{body}    </div>
  </div>"""
    write("about/index.html", page(
        title="Who's building it · SeaSand",
        canonical=f"{BASE}/about/",
        description="Ani Chaudhuri, founder and CEO of SeaSand. Four companies, four acquisitions.",
        hero='<p class="where">About</p>\n      <h1>Who\'s building it</h1>',
        main=main,
        og={"title": "Who's building it · SeaSand"},
        current="about",
    ))


def build_feed():
    items = "".join(f"""
  <item>
    <title>{e(p['title'])}</title>
    <link>{url_of(p)}</link>
    <guid>{url_of(p)}</guid>
    <pubDate>{format_datetime(datetime.strptime(p['date'], '%Y-%m-%d').replace(hour=12, tzinfo=timezone.utc))}</pubDate>
    <description>{e(p.get('description', p['dek']))}</description>
  </item>""" for p in posts)
    write("blog/feed.xml", f"""<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
<channel>
  <title>SeaSand Blog</title>
  <link>{BASE}/blog/</link>
  <description>Writing from SeaSand.</description>
  <language>en</language>{items}
</channel>
</rss>
""")


def build_sitemap():
    urls = [f"{BASE}/", f"{BASE}/about/", f"{BASE}/blog/"] + [url_of(p) for p in posts]
    body = "".join(f"\n  <url><loc>{u}</loc></url>" for u in urls)
    write("sitemap.xml", f'<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}\n</urlset>\n')


def sync_home_nav():
    path = os.path.join(ROOT, "index.html")
    s = open(path, encoding="utf-8").read()
    pat = re.compile(r"(<!-- nav:start -->\n)(.*?)(\n\s*<!-- nav:end -->)", re.S)
    if not pat.search(s):
        sys.exit("index.html: nav markers not found")
    s2 = pat.sub(lambda m: m.group(1) + "          " + nav(home=True) + m.group(3), s, count=1)
    if s2 != s:
        open(path, "w", encoding="utf-8").write(s2)
        print("updated index.html nav")


def clean_stale():
    blog = os.path.join(ROOT, "blog")
    if not os.path.isdir(blog):
        return
    for d in os.listdir(blog):
        full = os.path.join(blog, d)
        if os.path.isdir(full) and d not in slugs:
            print(f"note: blog/{d}/ is not a published post; remove it if it should be offline")


if __name__ == "__main__":
    build_index()
    for i in range(len(posts)):
        build_post(i)
    build_about()
    build_feed()
    build_sitemap()
    sync_home_nav()
    clean_stale()
