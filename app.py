from flask import Flask, jsonify, send_from_directory
import json
import os
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

app = Flask(__name__, static_folder='.', static_url_path='')

SYMBOLS = [
    ('EURUSD', 'EURUSD=X'),
    ('GBPUSD', 'GBPUSD=X'),
    ('USDCAD', 'USDCAD=X'),
    ('USDCHF', 'USDCHF=X'),
    ('XAUUSD', 'GC=F'),
]

NEWS_FEEDS = [
    'https://www.fxstreet.com/rss/news',
    'https://www.dailyfx.com/feeds/market-news',
]

CACHE = {}
CACHE_TTL = 60
USER_AGENT = 'ForexMasterProSite/1.0 (agentosacademy.com)'


def cache_get(key):
    entry = CACHE.get(key)
    if entry and time.time() - entry['ts'] < CACHE_TTL:
        return entry['data']
    return None


def cache_set(key, data):
    CACHE[key] = {'ts': time.time(), 'data': data}


def fetch_url(url, timeout=12):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_yahoo_quote(yahoo_symbol):
    url = (
        'https://query1.finance.yahoo.com/v8/finance/chart/'
        f'{yahoo_symbol}?interval=1d&range=5d'
    )
    raw = fetch_url(url)
    payload = json.loads(raw)
    result = payload['chart']['result'][0]
    meta = result['meta']
    price = meta.get('regularMarketPrice') or meta.get('previousClose')
    prev = meta.get('chartPreviousClose') or meta.get('previousClose') or price
    if not price or not prev:
        raise ValueError(f'Missing quote data for {yahoo_symbol}')
    change_pct = ((price - prev) / prev) * 100 if prev else 0.0
    return {
        'price': float(price),
        'change_pct': round(float(change_pct), 2),
        'updated': int(meta.get('regularMarketTime') or time.time()),
    }


def fetch_quotes():
    cached = cache_get('quotes')
    if cached is not None:
        return cached

    quotes = []
    for label, yahoo_symbol in SYMBOLS:
        try:
            q = fetch_yahoo_quote(yahoo_symbol)
            quotes.append({'symbol': label, **q})
        except (urllib.error.URLError, ValueError, KeyError, IndexError, json.JSONDecodeError):
            quotes.append({
                'symbol': label,
                'price': None,
                'change_pct': None,
                'error': True,
            })

    data = {'quotes': quotes, 'source': 'yahoo-finance', 'cached_seconds': CACHE_TTL}
    cache_set('quotes', data)
    return data


def parse_rss_items(xml_bytes, limit=12):
    root = ET.fromstring(xml_bytes)
    channel = root.find('channel')
    if channel is None:
        channel = root
    items = []
    for item in channel.findall('item')[:limit]:
        title_el = item.find('title')
        link_el = item.find('link')
        date_el = item.find('pubDate')
        if title_el is None or not (title_el.text or '').strip():
            continue
        title = (title_el.text or '').strip()
        link = (link_el.text or '').strip() if link_el is not None else ''
        pub_date = (date_el.text or '').strip() if date_el is not None else ''
        items.append({'title': title, 'url': link, 'published': pub_date})
    return items


def fetch_news():
    cached = cache_get('news')
    if cached is not None:
        return cached

    merged = []
    seen = set()
    for feed_url in NEWS_FEEDS:
        try:
            for item in parse_rss_items(fetch_url(feed_url), limit=10):
                key = item['title'].lower()
                if key in seen:
                    continue
                seen.add(key)
                merged.append(item)
        except (urllib.error.URLError, ET.ParseError):
            continue
        if len(merged) >= 15:
            break

    data = {'items': merged[:15], 'cached_seconds': CACHE_TTL}
    cache_set('news', data)
    return data


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/quotes')
def api_quotes():
    try:
        return jsonify(fetch_quotes())
    except Exception:
        return jsonify({'quotes': [], 'error': 'unavailable'}), 503


@app.route('/api/news')
def api_news():
    try:
        return jsonify(fetch_news())
    except Exception:
        return jsonify({'items': [], 'error': 'unavailable'}), 503


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
