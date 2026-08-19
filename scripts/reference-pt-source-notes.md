# PT reference source

Source: https://www.advantageengineering.com/fyi/289/advantageFYI289.php

The source publishes the exact table used in the user's image with columns Fahrenheit, Celsius, R-22, R-410a, R-407c, R-134a, and R-404a. Important verified rows include:

| °F | °C | R22 | R410A | R407C | R134a | R404A |
|---:|---:|---:|---:|---:|---:|---:|
| 41 | 5.0 | 70.0 | 121.8 | 63.1 | 36.0 | 88.6 |
| 32 | 0.0 | 57.5 | 101.6 | 50.9 | 27.8 | 73.8 |
| 22 | -5.6 | 45.3 | 82.3 | 39.1 | 19.9 | 59.3 |
| 2 | -16.7 | 25.7 | 50.9 | 20.4 | 7.5 | 35.7 |
| -4 | -20.0 | 20.9 | 43.1 | 15.9 | 4.6 | 29.8 |
| -40 | -40.0 | 0.6 | 10.1 | 4.8 | 14.7 (red/inHg) | 4.9 |
| -60 | -51.1 | 11.9 (red/inHg) | 0.9 (red/inHg) | 16.0 | 21.6 (red/inHg) | n/a |

The source notes that red values are inches of mercury (vacuum), while black values are PSIG. This means the app must preserve the reference pressure values and clearly handle negative/vacuum entries rather than treating all points as ordinary positive PSIG. The full page contains rows from 155°F down to -60°F.

Second source for context: https://www.hvac-australia.com.au/refrigerant-pt-chart
It explains that superheat = suction line temperature - evaporating saturation temperature and subcooling = condensing saturation temperature - liquid line temperature, and that R407C blends require dew/bubble point awareness.

Third source: https://www.johnstonesupply.com/pressure-temp-chart
It provides an independent PT table with common refrigerants and confirms common reference values around 0°F, 32°F, 50°F, and higher temperatures.
