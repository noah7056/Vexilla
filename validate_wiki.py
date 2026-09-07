import os
import json
import urllib.request
import urllib.parse
import re
import time

def get_flags():
    flags = []
    d = 'src/data/provinces'
    for f in os.listdir(d):
        if f.endswith('.ts') and f not in ['index.ts', 'utils.ts']:
            content = open(os.path.join(d, f)).read()
            for match in re.finditer(r"image:\s*['\"]([^'\"]+)['\"]", content):
                val = match.group(1)
                if not val.startswith('http'):
                    flags.append((f, val))
    return flags

flags = get_flags()
print(f"Checking {len(flags)} files...")

missing_flags = []
batch_size = 50
for i in range(0, len(flags), batch_size):
    batch = flags[i:i+batch_size]
    titles = "|".join(["File:" + urllib.parse.unquote(f[1]) for f in batch])
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(titles)}&format=json"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    while True:
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                pages = data.get('query', {}).get('pages', {})
                for pid, pdata in pages.items():
                    if 'missing' in pdata:
                        title = pdata['title'].replace('File:', '')
                        for (f, img) in batch:
                            if urllib.parse.unquote(img).replace('_', ' ') == title.replace('_', ' '):
                                missing_flags.append((f, img, title))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print("429, retrying in 2 seconds...")
                time.sleep(2)
            else:
                print("Error", e)
                break
        except Exception as e:
            print("Error", e)
            break
    time.sleep(1)

print(f"\nFound {len(missing_flags)} missing flags:")
for m in missing_flags:
    print(m)
