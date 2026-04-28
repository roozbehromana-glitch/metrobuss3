# Bucharest Metro Resilience Calculator

## 1) What this app does
This local web application evaluates Bucharest Metro resilience under user-defined disruption scenarios, then compares metro-only vs. bus-bridging strategies and recommends the best strategy automatically.

## 2) How the Bucharest metro graph is stored
The predefined network core is stored in `data/bucharestMetroCore.json` as a fixed internal graph (`nodes` + `edges`) with metadata, station attributes, and direct line links for M1-M5.

## 3) Why users cannot edit graph nodes and links
The app is designed for non-programmer transport engineers: users should only define disruption variables, while the core network remains methodologically consistent and reproducible. The frontend only exposes dropdown selection of existing lines/stations/segments.

## 4) How to run locally
```bash
npm install
npm start
```
Open: `http://localhost:3000`

Optional graph integrity check:
```bash
npm run validate:graph
```

## 5) How to input a scenario
In **Scenario Input** fill:
- Scenario identity and horizon
- Disruption type
- Affected line/station/segment from dropdowns
- Headways, disruption/recovery duration, severity and demand
- Bus fleet, capacity, round trip, target headway, curb capacity
- Optional model weights (`w1 + w2 + w3 = 1`)

Click **Calculate Resilience**.

## 6) How the resilience ratio is calculated
The backend computes:
- `MHD(t) = |disruptedHeadway(t) - scheduledHeadway|`
- `MHD_score(t) = max(0, 1 - MHD(t)/MHD_threshold)`
- `SAR(t)` from active served links under disruption + bridge restoration
- `SRI(t)` from OD path availability (interchanges, terminals, affected station links)
- `Q(t) = w1*MHD_score + w2*SAR + w3*SRI`
- Cumulative resilience ratio `R = average(Q(t))`

Also returned: performance loss, min performance, recovery time.

## 7) How bus-bridging recommendation works
The app auto-compares:
- Metro-only baseline
- Standard bridge
- Extended bridge
- Parallel bridge
- Recommended strategy (including hybrid when needed)

Rules use disruption duration, demand, interchange criticality, affected extent, SAR/SRI levels, and fleet feasibility.

## 8) How to configure Gemini image generation
Set `GEMINI_API_KEY` in `.env`.
If not configured, UI displays:
`AI diagram generation is disabled because GEMINI_API_KEY is not configured.`

Gemini is used only for optional scenario diagrams, never for resilience calculations.

## 9) How developers can update the core graph
Edit `data/bucharestMetroCore.json` manually, then run:
```bash
npm run validate:graph
```

Validation checks:
- edge source/target existence
- per-line connectivity
- interchange line membership
- duplicate station IDs
