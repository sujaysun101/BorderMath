<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BorderMath

BorderMath is a **global mobility and visa compliance planner** for travelers, digital nomads, and remote workers managing stays across multiple countries.

It helps users:
- Build and reorder multi-country itineraries
- Track Schengen 90/180 compliance (with a built-in safety buffer)
- Monitor country-specific stay limits and overstay risk
- Check passport validity against travel legs
- Store passport/visa records in a document vault
- Track visa applications and expiry alerts
- Estimate visa costs and compare trip-level totals
- View mock regulation updates relevant to citizenship(s)

The app uses Firebase Auth (Google sign-in), Firestore, and Firebase Storage for user/profile/document data.

---

## What the application includes

### 1) Landing + authentication
- Public landing page describing BorderMath capabilities
- Google sign-in via Firebase Authentication
- Auth-aware routing into the main planner

### 2) Itinerary planner (Explorer tab)
- Add destination legs with entry/exit dates
- Drag-and-drop leg ordering
- Country picker with Schengen vs non-Schengen labeling
- Per-leg visa requirement type and estimated fee (mock data service)
- Live compliance checks as itinerary changes

### 3) Compliance engine
- Schengen rolling-window tracking (90 days in any 180-day period, with an 88-day safety threshold)
- Country stay overage checks based on stay limits
- Passport validity checks against trip dates and alert threshold
- Consolidated compliance status banner and notes

### 4) Document Vault (Vault tab)
- Passport details and customizable alert threshold
- Passport PDF upload to Firebase Storage
- Visa document records with optional file upload
- Visa application tracking (pending/approved/rejected/withdrawn)
- Expiry warnings and quick renewal search links
- CSV export for passport/visa/application data

### 5) Tools tab
- Currency converter (mock exchange rates)
- Visa cost analysis by itinerary leg + total estimate
- Schengen usage history chart
- Insurance recommendation cards

---

## Local development

### Prerequisites
- Node.js 18+
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy the sample file and set values:
```bash
cp .env.example .env.local
```

Minimum expected values:
- `GEMINI_API_KEY` (read by Vite config; set it to avoid undefined environment values in local/dev builds)
- `APP_URL` (used for hosted/deployment contexts)

### 3. Firebase configuration
The app reads Firebase settings from:
- `./firebase-applet-config.json` (relative to the project root)

If you are not using the included AI Studio Firebase project, replace this file with your own Firebase app config (Auth + Firestore + Storage enabled).

### 4. Start the app
```bash
npm run dev
```
Then open `http://localhost:3000`.

---

## How to use BorderMath

1. **Sign in with Google** from the landing page.
2. In **Explorer**:
   - Click **Add Country** to add itinerary legs.
   - Set country + entry/exit dates for each leg.
   - Reorder legs via drag and drop.
   - Watch compliance status update in real time.
3. Review **compliance notes** for Schengen/country/passport risks.
4. Open **Vault** to:
   - Add/edit passport info and alert threshold.
   - Upload passport copy.
   - Add visa documents and visa applications.
   - Export structured data as CSV.
5. Open **Tools** to:
   - Convert currencies.
   - Review per-leg visa fee estimates.
   - Visualize Schengen usage trend history.

---

## Scripts

```bash
npm run dev     # Run local dev server on port 3000
npm run lint    # TypeScript type-check (no emit)
npm run build   # Production build
npm run preview # Preview production build
npm run clean   # Remove dist output
```

---

## Notes

- Some data providers are currently mocked in this codebase (e.g., visa requirements, regulation updates, exchange rates).
- Core travel calculations and alerts are computed client-side from your itinerary/profile/documents.
- Uploaded documents and user records are stored in Firebase services configured for the project.
