# Tour Proposal Generator

Branded tour proposal generation web application for Nusa Flores Travel, transforming Google Sheet tour data into print-quality A4 PDF documents and shareable HTML previews.

---

## Single-Tab Google Sheet Structure

Your Google Sheet uses **1 tab** where each row is a proposal document (like a database row):

| Column Header | Description / Format | Example |
|---|---|---|
| `proposal_id` | Unique slug (Required) | `flores-overland-4d` |
| `status` | `ready`, `draft`, or `archived` | `ready` |
| `version` | Free text version badge | `v3` |
| `title` | Product title | `Flores Overland Tour 4 Days` |
| `cover_image_url` | Hero photo URL | `https://...` (or blank) |
| `tour_type` | Tour classification | `Private Tour (Minimum 2 People)` |
| `travel_date` | Travel year or dates | `2026` |
| `route` | Route description | `Ende - Kelimutu - Bajawa - Ruteng - Labuan Bajo` |
| `intro_text` | Paragraphs under General Info (separated by blank lines) | `Please find your detailed tour quotation...` |
| `extra_info` | Key-value pairs per line | `Pickup: Ende Airport\nFinish: Labuan Bajo` |
| `custom_html` | Optional custom HTML block (sanitized) | `<div>...</div>` |
| `itinerary_1` | Day 1 details (Title on line 1, bullets, hotel note) | See Itinerary format below |
| `itinerary_2` | Day 2 details | ... |
| `itinerary_3` | Day 3 details | ... |
| `...` | ... | ... |
| `itinerary_12` | Day 12 details (leave blank if tour has fewer days) | ... |
| `pricing` | Multi-line price rows delimited by pipe `\|` | See Pricing format below |
| `inclusions` | 1 item per line | `Private car, driver and petrol\nTour Guide...` |
| `exclusions` | 1 item per line | `Flight tickets\nLunch and dinner...` |

---

### How to Format Multi-Line Cells

#### 1. Itinerary Columns (`itinerary_1` to `itinerary_12`)
Each day has its own column. Inside each day's cell:
- **Line 1**: Day title (e.g. `Journey to Moni`)
- **Following lines**: Bullet point items for that day
- **Optional line starting with `Accommodation:`**: Sets the accommodation note
- **Optional line starting with `Photo:`**: Sets the photo URL

Example in `itinerary_1` cell:
```text
Journey to Moni
Picked up at Ende Airport (ENE) Transfer to Moni. On the way stop over in Detusoko, rice field walk.
Visit Wologai Village ; a traditional village lived by Lionese
Stay and overnight at Lodge in Moni
Accommodation: See Price List
```

Example in `itinerary_2` cell:
```text
Kelimutu
Seeing the Kelimutu Lakes at dawn is a truly magical experience...
Breakfast at lodge, loading luggage and check out. Drive to Penggajawa
Stop over in Blue stone Beach
Drive to Bajawa, Stay and overnight at Hotel in Bajawa.
Accommodation: See Price List
Photo: https://example.com/kelimutu.jpg
```

*(For a 4-day tour, fill `itinerary_1` to `itinerary_4` and leave `itinerary_5` through `itinerary_12` empty. The app automatically detects how many days exist).*

#### 2. `pricing` Column
Each row is one line using pipe delimiters `|`:
`Option Label | Row Type | Price Amount | Currency | Stays (semicolon-separated)`
```text
OPTION #1 | Without Tour Guide | 5000000 | IDR | Bintang Lodge Moni - Day 1; Silverin Hotel Bajawa - Day 2; Sky Flores Hotel Ruteng - Day 3
OPTION #1 | Include Tour Guide | 6100000 | IDR | Bintang Lodge Moni - Day 1; Silverin Hotel Bajawa - Day 2; Sky Flores Hotel Ruteng - Day 3
OPTION #2 | Without Tour Guide | 5000000 | IDR | Spring Hill Hotel Ruteng - Day 3; Sabrina Rest and Living - Day 2; Spring Hill Hotel Ruteng - Day 3
OPTION #2 | Include Tour Guide | 6100000 | IDR | Ecolodge Moni - Day 1; Sabrina Rest and Living - Day 2; Spring Hill Hotel Ruteng - Day 3
```

#### 3. `inclusions` & `exclusions` Columns
One bullet item per line in the cell:
```text
Private Car, driver and petrol
Tour Guide
Entrance fee
Mineral water
Accomodation 3 nights
3x Breakfast at Hotel
```

---

## Company Settings (Fixed Constants in App)

Company branding and contact information are stored as code constants in [`src/lib/settings.ts`](file:///C:/Projects/Crispim-TourProposal/src/lib/settings.ts).

You can view and preview these settings in the app at:
- **URL**: [http://localhost:4321/settings](http://localhost:4321/settings)

---

## Google Apps Script Setup

1. Open your 1-tab spreadsheet &rarr; **Extensions &rarr; Apps Script**.
2. Copy the script from [`scripts/Code.gs`](file:///C:/Projects/Crispim-TourProposal/scripts/Code.gs) and paste it into the editor.
3. Click **Deploy &rarr; New deployment &rarr; Web app** (Execute as: `Me`, Who has access: `Anyone`).
4. Set the generated URL in [`.env`](file:///C:/Projects/Crispim-TourProposal/.env):
   ```env
   GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
   ```

---

## Running the Application

```bash
# Start development server
npm run dev

# Or build & run production standalone server
npm run build
npm start

# Run end-to-end verification tests
npm test
```

- **URL**: [http://localhost:4321](http://localhost:4321)
- **Dev Credentials**: `admin` / `admin123`
