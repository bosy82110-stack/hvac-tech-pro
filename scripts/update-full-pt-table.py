from pathlib import Path
import json
import re

root = Path('/home/ubuntu/hvac-fix/hvac-tech-pro')
source = root / 'scripts/reference-pt.json'
target = root / 'app/[section].tsx'
rows = json.loads(source.read_text())

# The reference chart marks vacuum values in red/inHg. The app accepts gauge or
# absolute PSI, so vacuum/inHg entries must not be treated as positive PSIG.
# Keep only the black PSIG values for pressure-to-saturation calculations.
keys = ['r22', 'r410a', 'r407c', 'r134a', 'r404a']
blocks = []
for key in keys:
    key_index = keys.index(key)
    points = [r for r in rows if r[key] is not None and r['tempF'] >= -40 and not r['vacuum'][key_index]]
    # R404A has no reference values below -40F; this filter preserves its full range.
    points = sorted(points, key=lambda r: r['tempC'])
    body = ',\n'.join(f"    {{ tempC: {r['tempC']:.1f}, psig: {r[key]:.1f} }}" for r in points)
    blocks.append(f"  {key}: [\n{body},\n  ]")
new_block = "const ptTables: Record<string, PtPoint[]> = {\n" + ',\n'.join(blocks) + "\n};"
text = target.read_text()
start_marker = 'const ptTables: Record<string, PtPoint[]> = {'
end_marker = 'const saturationTempFromPressure'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('PT table block not found')
updated = text[:start] + new_block + '\n' + text[end:]
count = 1
target.write_text(updated)
print('updated', target)
for key in keys:
    key_index = keys.index(key)
    points = [r for r in rows if r[key] is not None and r['tempF'] >= -40 and not r['vacuum'][key_index]]
    print(key, len(points), 'range', points[0]['tempC'], 'to', points[-1]['tempC'])
