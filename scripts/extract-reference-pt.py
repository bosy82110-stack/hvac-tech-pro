from pathlib import Path
import json
import requests
from bs4 import BeautifulSoup

url = 'https://www.advantageengineering.com/fyi/289/advantageFYI289.php'
html = requests.get(url, timeout=30).text
soup = BeautifulSoup(html, 'html.parser')
rows = []
for row in soup.select('.grid-289-002'):
    cells = [c.get_text(' ', strip=True) for c in row.find_all('div', recursive=False)]
    if len(cells) < 7:
        continue
    try:
        f = float(cells[0].replace(',', '.'))
        c = float(cells[1].replace(',', '.'))
        raw_values = cells[2:7]
        values = [None if v.lower() in {'n/a', '-', '—'} else float(v.replace(',', '.')) for v in raw_values]
        vacuum = [bool((cell.get('class') and 'R' in cell.get('class')) or cell.find(class_='R')) for cell in row.find_all('div', recursive=False)[2:7]]
    except ValueError:
        continue
    rows.append({'tempF': f, 'tempC': c, 'r22': values[0], 'r410a': values[1], 'r407c': values[2], 'r134a': values[3], 'r404a': values[4], 'vacuum': vacuum})
if len(rows) < 80:
    raise SystemExit(f'expected full table, got {len(rows)} rows')
# The provided reference image clearly shows R22 = 26.5 PSIG at 3°F.
# The web page has a typographical 25.5 at this single row, so prefer the image.
for row in rows:
    if row['tempF'] == 3.0:
        row['r22'] = 26.5
rows.sort(key=lambda x: x['tempC'])
Path('/home/ubuntu/hvac-fix/hvac-tech-pro/scripts/reference-pt.json').write_text(json.dumps(rows, indent=2))
for key in ['r22', 'r410a', 'r407c', 'r134a', 'r404a']:
    points = [r for r in rows if r[key] is not None]
    print(key, len(points), points[0], points[-1])
