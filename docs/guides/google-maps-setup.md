# Google Maps API Key Setup

## 1. Create API Key in GCP Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > API Key**
5. Copy the generated key

## 2. Enable Required APIs

In the GCP Console, go to **APIs & Services > Library** and enable:

| API | Purpose |
|-----|---------|
| Maps SDK for Android | Map rendering in Android apps |
| Maps SDK for iOS | Map rendering in iOS apps |
| Maps JavaScript API | Web-based maps |
| Geocoding API | Address → coordinates (backend) |
| Distance Matrix API | Delivery distance/time calculations (backend) |
| Places API | Address autocomplete, place search |

## 3. Restrict the API Key (Recommended)

In **APIs & Services > Credentials**, edit the key and add restrictions:

- **Application restrictions**: Select **Android apps**, **iOS apps**, and **HTTP referrers** (web)
- **API restrictions**: Restrict to the 6 APIs listed above

### Android Restriction
- Package name: `com.smartfood.admin`, `com.smartfood.customer`, `com.smartfood.restaurant`
- SHA-1 certificate fingerprint: (get from `cd android && ./gradlew signingReport`)

### iOS Restriction
- Bundle identifiers: `com.smartfood.admin`, `com.smartfood.customer`, `com.smartfood.restaurant`

### HTTP Referrers (Web)
- `localhost`
- Your production domain

## 3. Configure Across the Monorepo

### Mobile Apps (`apps/*/.env`)

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

Update in all three apps:
- `apps/admin/.env`
- `apps/customer/.env`
- `apps/restaurant/.env`

### EAS Build Profiles (`apps/*/eas.json`)

Replace `your_google_maps_api_key` under `build.*.env` in:
- `apps/admin/eas.json`
- `apps/customer/eas.json`
- `apps/restaurant/eas.json`

### Backend (`backend/.env`)

```env
GOOGLE_MAPS_API_KEY=AIzaSy...
```

## 4. Verify

```bash
# Check the key is loaded
cd apps/admin && npx expo config
# Look for EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in the output
```

## 5. Billing & Quotas

- Set a daily budget cap in GCP Billing
- Monitor usage in GCP Console > APIs & Services > Dashboard
- Typical quotas: 2500 free geocoding requests/day, $0.005/request after

## 6. Security

- **Never commit the real key to git** — `.env` files are in `.gitignore`
- Use EAS Secrets for production builds: `eas secret:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value AIzaSy...`
- Restrict the key by HTTP referrer, IP, or app bundle ID in GCP Console
- Set up budget alerts in GCP Billing to avoid unexpected charges

## 7. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Map doesn't render | Key not set or restricted | Check `.env` and GCP restrictions |
| "This API requires billing" | Billing not enabled | Enable billing in GCP |
| "API key not valid" | Wrong key or restrictions | Verify key in GCP Console |
| Geocoding fails | Geocoding API not enabled | Enable in GCP > APIs & Services |</think>

<｜DSML｜tool_calls>
<｜DSML｜invoke name="write">
<｜DSML｜parameter name="filePath" string="true">C:\project\smart_food\docs\guides\google-maps-setup.md