# seasand.ai

SeaSand stealth landing page and blog.

Static files on GitHub Pages: the home page `index.html`, the blog under `blog/`, plus `favicon.svg`, `robots.txt` and `sitemap.xml`. Custom domain set by the `CNAME` file and the apex DNS records at Namecheap.

Search engines may index the site (Ani, 11 Nov 2026). `robots.txt` allows all crawlers.

Source of the page: Designer's artifact https://claude.ai/artifact/4kK4TNwXRzmSdx1dJ3ox7c (version 1794423235-8a1f), with a standard HTML head added.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Any push to `main` ships to seasand.ai.

## Navigation and blog

One list drives the navigation on every page: `_blog/site.json` → `nav`. The home page keeps its own in-page links (`#hiring`), blog pages link back with `/#hiring`, and "Blog" goes to `/blog/`. To add a section later (a careers page, The Sea Suite page), add one entry there and run the build.

The blog pages are generated. Sources live in `_blog/` (GitHub Pages does not publish folders that start with `_`):

- `_blog/posts.json`: one entry per post (slug, title, date, author, dek, description, image, `published`).
- `_blog/posts/<slug>.html`: the post body.
- `_blog/partials/`: the blog CSS (the home page's tokens), the lockups and the shore wave.

Add a post:

1. Write `_blog/posts/<slug>.html` and add its entry to `_blog/posts.json` (`"published": true`).
2. Put its 1200×627 share image at `blog/<slug>/og.png`.
3. Run `python3 _blog/build.py`. It writes `blog/index.html` (newest first), `blog/<slug>/index.html` with Older/Newer links, `blog/feed.xml`, `sitemap.xml`, and refreshes the nav between `<!-- nav:start -->` and `<!-- nav:end -->` in `index.html`.
4. Commit and push. After it is live, check the preview in LinkedIn Post Inspector and the Facebook Sharing Debugger.

Don't edit the generated `blog/*.html` by hand; the next build overwrites them.
