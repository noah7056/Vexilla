import urllib.request
import re
from html.parser import HTMLParser

url = "https://en.wikipedia.org/wiki/List_of_Mexican_flags"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# extract matches for flag images
matches = re.findall(r'href="/wiki/File:([^"]+)" title="[^"]+"><img alt="[^"]+" src="[^"]+" decoding="async" width="\d+" height="\d+"', html)

flags = []
for m in matches:
    if "Flag_of_" in m and ".svg" in m:
        flags.append(m)

print("Found flags:", set(flags))
