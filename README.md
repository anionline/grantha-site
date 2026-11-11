# seasand.ai

SeaSand stealth landing page.

Single static `index.html` (plus `favicon.svg` and `robots.txt`), hosted on GitHub Pages. Custom domain set by the `CNAME` file and the apex DNS records at Namecheap.

Search engines may index the site (Ani, 11 Nov 2026). `robots.txt` allows all crawlers.

Source of the page: Designer's artifact https://claude.ai/artifact/4kK4TNwXRzmSdx1dJ3ox7c (version 1794423235-8a1f), with a standard HTML head added.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Any push to `main` ships to seasand.ai.
