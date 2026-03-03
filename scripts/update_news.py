import os
import json
import time
import requests
import feedparser
import re
from datetime import datetime
from bs4 import BeautifulSoup

# Define feed sources
FEEDS = [
    {"name": "Google AI Blog", "url": "https://blog.google/technology/ai/rss/"},
    {"name": "OpenAI Blog", "url": "https://cdn.openai.com/news-rss/"}, # Fallback to standard rss paths or let BeautifulSoup fallback
    {"name": "arXiv cs.AI", "url": "http://export.arxiv.org/rss/cs.AI"},
    {"name": "arXiv cs.LG", "url": "http://export.arxiv.org/rss/cs.LG"},
    {"name": "Hugging Face Blog", "url": "https://huggingface.co/blog/feed.xml"}
]

DATA_PATH = "data/ai-news.js"
MAX_ITEMS = 12

def clean_html(raw_html):
    """Remove HTML tags and decode entities."""
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    return text

def fetch_feeds():
    items = []
    seen_urls = set()
    
    headers = {"User-Agent": "Mozilla/5.0"}
    
    for feed in FEEDS:
        print(f"Fetching {feed['name']}...")
        try:
            # Fetch directly using requests to handle possible headers issues
            response = requests.get(feed['url'], headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"Skipping {feed['name']} due to HTTP {response.status_code}")
                continue
                
            parsed = feedparser.parse(response.content)
            for entry in parsed.entries:
                url = entry.link
                if url in seen_urls:
                    continue
                seen_urls.add(url)
                
                title = clean_html(entry.title)
                
                # Try getting published date, fallback to now
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    dt = datetime.fromtimestamp(time.mktime(entry.published_parsed))
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    dt = datetime.fromtimestamp(time.mktime(entry.updated_parsed))
                else:
                    dt = datetime.utcnow()
                
                # Get summary
                summary_raw = ""
                if hasattr(entry, 'summary'):
                    summary_raw = entry.summary
                elif hasattr(entry, 'description'):
                    summary_raw = entry.description
                    
                short_summary = clean_html(summary_raw)
                if len(short_summary) > 180:
                    short_summary = short_summary[:177] + "..."
                    
                # Tagging logic (rudimentary)
                tag = "NEWS"
                title_lower = title.lower()
                if "open source" in title_lower or "release" in title_lower or "announce" in title_lower:
                    tag = "BREAKING"
                elif "research" in title_lower or "arxiv" in feed['name'].lower():
                    tag = "RESEARCH"
                elif "robot" in title_lower:
                    tag = "ROBOTICS"
                elif "model" in title_lower or "llm" in title_lower:
                    tag = "MODEL"
                
                items.append({
                    "title": title,
                    "url": url,
                    "source": feed['name'],
                    "published_at": dt.isoformat() + "Z",
                    "short_summary": short_summary,
                    "tag": tag
                })
        except Exception as e:
            print(f"Error fetching {feed['name']}: {e}")

    # Deduplicate again by title (just in case)
    unique_items = []
    seen_titles = set()
    for item in items:
        title_lower = item['title'].lower()
        if title_lower not in seen_titles:
            seen_titles.add(title_lower)
            unique_items.append(item)

    # Sort by published date descending
    unique_items.sort(key=lambda x: x["published_at"], reverse=True)
    
    return unique_items[:MAX_ITEMS]

def main():
    print("Starting AI News fetch...")
    news_items = fetch_feeds()
    
    if not news_items:
        print("No news items found. Exiting.")
        return
        
    data = {
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "items": news_items
    }
    
    # Ensure dir exists
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        f.write("window.aiNewsData = ")
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write(";\n")
        
    print(f"Successfully saved {len(news_items)} items to {DATA_PATH}")

if __name__ == "__main__":
    main()
