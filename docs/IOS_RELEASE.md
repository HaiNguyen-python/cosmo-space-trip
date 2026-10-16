# Publishing Cosmo's Space Trip on the App Store

Apple only builds iPhone and iPad apps on a Mac. This project is set up so that **a Mac in the cloud (Codemagic) builds the app for you** and uploads it to Apple. Everything below can be done from Windows in a web browser.

```
Your PC (Windows) ──push──▶ GitHub ──▶ Codemagic (cloud Mac) ──upload──▶ App Store Connect ──▶ TestFlight / App Store
```

## What's already set up in this folder

| File | What it does |
|---|---|
| `package.json` | Capacitor (wraps the game as a native iOS app) plus the Haptics, Preferences and Splash Screen plugins |
| `capacitor.config.json` | App ID `com.hainguyen.cosmospacetrip`, app name, dark background, no web-view scrolling |
| `scripts/build-web.mjs` | Copies the game into `www/` for packaging |
| `scripts/configure-ios.sh` | Landscape only, full screen, hidden status bar, Home Screen name "Space Trip", export compliance answer |
| `resources/` | App icon (1024², no transparency) and launch screens (2732²). Regenerate with `tools/art.html`. |
| `codemagic.yaml` | The cloud build: creates the Xcode project, signs it, numbers the build and uploads it to TestFlight |
| `docs/privacy-policy.html`, `docs/index.html` | Privacy policy and support pages to host for free on GitHub Pages |
| `docs/APP_STORE_LISTING.md` | Ready-to-paste App Store text and privacy answers |

The game itself is App Store ready. It works fully offline, uses system fonts (no downloads), collects no data, has no ads, keeps Settings behind a parental gate, plays landscape only, and backs up saves to native storage.

> **Changing the App ID:** it must be unique on the App Store, and it can't change after the first upload. To use a different one, edit it in **both** `capacitor.config.json` (`appId`) and `codemagic.yaml` (`bundle_identifier`).

---

## Step 1: Join the Apple Developer Program (once)
1. Go to developer.apple.com/programs and enroll as an **Individual** (US $99 per year).
2. Approval can take up to 48 hours.

## Step 2: Put the project on GitHub (once)
1. Install **GitHub Desktop** (desktop.github.com) and sign in, creating a free account if needed.
2. Choose **File → Add local repository →** `M:\Game Design\space-adventure`. When it says this isn't a repository yet, click **create a repository**.
3. Click **Publish repository**. Keeping it **private** is fine.

Later, whenever you change the game: write a summary in GitHub Desktop, then click **Commit** and **Push**.

## Step 3: Create the app in App Store Connect (once)
1. Go to appstoreconnect.apple.com → **Apps → + → New App**.
2. Fill in:
   - **Platform:** iOS
   - **Name:** Cosmo's Space Trip: Planets (this name must be unique on the App Store, so adjust it if it's taken)
   - **Primary language:** English (U.S.)
   - **Bundle ID:** pick `com.hainguyen.cosmospacetrip`. If it isn't listed, register it first at developer.apple.com → Certificates, IDs & Profiles → Identifiers → **+** → App IDs. No extra capabilities are needed.
   - **SKU:** `cosmo-space-trip`
3. Open the new app → **App Information**. Copy the **Apple ID** number and paste it into `codemagic.yaml` as `APP_STORE_APPLE_ID`.

## Step 4: Create an App Store Connect API key (once)
This lets Codemagic sign and upload builds for you.
1. In App Store Connect, go to **Users and Access → Integrations → App Store Connect API → Team Keys → +**.
2. Name it `Codemagic` and give it **App Manager** access.
3. **Download** the `.p8` file. You can only download it once, so keep it safe.
4. Note the **Issuer ID** and the **Key ID**.

## Step 5: Connect Codemagic (once)
1. Sign up at codemagic.io **with your GitHub account**. The free plan includes monthly build minutes on Apple silicon Macs.
2. **Add application** → pick the GitHub repository → choose **codemagic.yaml** as the configuration.
3. Go to **Team settings → Integrations → Developer Portal → Connect**. Enter the Issuer ID, Key ID and `.p8` file, and name the key exactly **`Codemagic API Key`** (it must match `codemagic.yaml`).
4. Go to **Team settings → Code signing identities**:
   - **iOS certificates →** generate a new **Apple Distribution** certificate, and keep the password it shows you.
   - **iOS provisioning profiles →** fetch profiles from the Developer Portal. Pick an **App Store** profile for `com.hainguyen.cosmospacetrip`, or create one on developer.apple.com first.

## Step 6: Build and upload
1. In Codemagic, open the app → **Start new build** → workflow **iOS build to TestFlight**.
2. It takes about 15–25 minutes. The finished build appears in App Store Connect under **TestFlight** after Apple processes it (usually 10–30 minutes more).
3. If a build fails, open the failing step in Codemagic. The log usually names the problem, most often signing or a wrong `APP_STORE_APPLE_ID`.

## Step 7: Test on a real iPhone or iPad
1. In App Store Connect → **TestFlight → Internal Testing**, create a group and add yourself.
2. Install the **TestFlight** app on your device, accept the invite, and play.
3. Check that it runs in landscape, sound and read-aloud work, progress is kept after closing the app, and Settings asks the grown-up question.

## Step 8: Screenshots
App Store Connect needs screenshots for:
- **iPhone 6.9"**: 2868 × 1320 (landscape)
- **iPad 13"**: 2752 × 2064 (landscape), because the app runs on iPad

**They're already made.** The `screenshots/` folder has 10 framed, captioned screenshots for each size (`iphone-01-map.png` … `ipad-10-wardrobe.png`, including the Space Base, critters, Star Story and the asteroid belt), which is Apple's maximum. Upload them in this order.

To remake them after changing the game, open http://localhost:8124/tools/screenshots.html while the game's local server is running, then click each file name to download it.

## Step 9: Fill in the listing and submit
1. Copy the text from `docs/APP_STORE_LISTING.md` into the app's **App Store** tab.
2. **Privacy policy and support URLs:** first replace `[YOUR SUPPORT EMAIL]` in `docs/privacy-policy.html` and `docs/index.html` with a real contact address. Then host them with GitHub Pages, which is free for **public** repositories:
   - If the game's repository is public: on github.com, go to **Settings → Pages → Deploy from a branch → main → /docs**.
   - If it's private: create a second, **public** repository (for example `cosmo-space-trip-site`), put just `index.html` and `privacy-policy.html` in it, and turn on Pages there from the **main** branch, **/ (root)** folder.

   Your URLs will look like `https://<your-github-name>.github.io/<repo-name>/privacy-policy.html` (privacy policy) and `https://<your-github-name>.github.io/<repo-name>/` (support page).
3. **App Privacy → Get Started →** answer **"No, we do not collect data from this app."**
4. **Age Rating:** answer "None" to everything. The result is 4+.
5. Under **Kids Category**, choose **Ages 6–8**.
6. Add the TestFlight build under **Build**, then click **Add for Review → Submit**.

Review usually takes 1–3 days. The review notes in `APP_STORE_LISTING.md` explain the parental gate to the reviewer.

## Releasing an update
1. Change the game and test it in the browser.
2. Raise `APP_VERSION` in `codemagic.yaml` (for example `1.1.0`). Build numbers go up automatically.
3. Commit and push in GitHub Desktop, then start a new Codemagic build.
4. In App Store Connect, create a new version, pick the new build, and submit.

## Testing in the browser (no Mac needed)
From `M:\Game Design`:
```bash
py -m http.server 8124 --directory space-adventure
```
Then open http://localhost:8124. Native extras (haptics, native save backup) only switch on inside the iOS app.

## Notes
- The project uses **Capacitor 7**. If a newer major version is out when you build, the current setup still works. Upgrading later is done with `npx cap migrate`.
- Kids Category rules this app already follows: no third-party analytics or ads, no external links, no data collection, and a parental gate before the grown-ups area. Keep it that way when adding features. Any future link out of the app or purchase must also sit behind the parental gate.
