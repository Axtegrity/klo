# KLO App — App Store Submission Guide

**App ID:** `io.keithlodom.klo`
**App Name:** KLO
**Stack:** Next.js + Capacitor 8

This guide walks through every step to get KLO into the Google Play Store and Apple App Store. Follow it in order. Don't skip steps.

---

## Table of Contents

1. [Prerequisites (Do These First)](#1-prerequisites)
2. [Build the Web App](#2-build-the-web-app)
3. [Android — Google Play Store](#3-android--google-play-store)
4. [iOS — Apple App Store](#4-ios--apple-app-store)
5. [Store Screenshots](#5-store-screenshots)
6. [Store Listing Content](#6-store-listing-content)
7. [Common Issues & Fixes](#7-common-issues--fixes)

---

## 1. Prerequisites

### What You Need Before Starting

| Item | Android | iOS | Cost |
|------|---------|-----|------|
| Developer account | Google Play Console | Apple Developer Program | $25 one-time / $99 per year |
| IDE | Android Studio | Xcode (Mac only) | Free / Free |
| Physical device (optional but recommended) | Any Android phone | iPhone | — |
| Node.js 18+ | Yes | Yes | Free |

### Step 1A: Create a Google Play Developer Account

1. Go to https://play.google.com/console/signup
2. Sign in with Keith's Google account (or a dedicated business Google account)
3. Pay the **$25 one-time fee**
4. Fill out the developer profile (name, address, email, phone)
5. Google requires **identity verification** — they'll ask for a government-issued ID
6. Verification can take **24-48 hours** — do this early

### Step 1B: Enroll in the Apple Developer Program

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with Keith's Apple ID (or create a dedicated one)
3. Pay the **$99/year fee**
4. If enrolling as an individual: just need Apple ID + payment
5. If enrolling as an organization: need a D-U-N-S number (free but takes a few days)
6. Approval can take **24-48 hours**

### Step 1C: Install the IDEs

**Android Studio:**
1. Download from https://developer.android.com/studio
2. Install it (follow the wizard, accept all defaults)
3. On first launch, it will download Android SDK — let it finish (takes 10-15 min)
4. Make sure SDK is installed at: `/Users/timothyadams/Library/Android/sdk` (it already is on Tim's machine)

**Xcode (Mac only):**
1. Open the Mac App Store
2. Search "Xcode" and install it (it's large, ~12 GB — give it time)
3. After install, open Xcode once and accept the license agreement
4. It will install additional components — let it finish

---

## 2. Build the Web App

Every time you want to update the native apps, you rebuild the web app first.

Open Terminal, navigate to the project:

```bash
cd ~/klo-app
```

### Step 2A: Install dependencies (if needed)

```bash
npm install
```

### Step 2B: Build the web app

```bash
npm run build
```

This creates the `out/` folder with the compiled web app.

### Step 2C: Sync with Capacitor

```bash
npx cap sync
```

**What this does:** Copies the `out/` folder into both `android/` and `ios/` native projects, and updates native plugins.

You should see output like:
```
✔ Copying web assets from out to android/app/src/main/assets/public
✔ Copying web assets from out to ios/App/App/public
✔ Updating Android plugins
✔ Updating iOS plugins
```

**IMPORTANT:** Run `npx cap sync` every time you make changes to the web app before building native apps.

---

## 3. Android — Google Play Store

### Step 3A: Open the project in Android Studio

```bash
npx cap open android
```

This opens Android Studio with the KLO project. Wait for Gradle sync to finish (bottom progress bar).

### Step 3B: Test on an emulator (recommended first)

1. In Android Studio, click the **device dropdown** at the top (next to the green play button)
2. Click **"Device Manager"** (or the phone icon on the right sidebar)
3. Click **"Create Device"**
4. Choose **Pixel 7** → Next
5. Select **API 34** (or latest) → Download if needed → Next → Finish
6. Click the **green play button** to run the app
7. The emulator launches and KLO should load — test that everything works

### Step 3C: Create your signing key (ONE TIME ONLY)

**CRITICAL: You only do this once. Back up the keystore file. If you lose it, you can never update your app.**

Open Terminal:

```bash
keytool -genkey -v \
  -keystore ~/klo-release.keystore \
  -alias klo \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

It will ask you:
- **Keystore password:** Choose a strong password. WRITE IT DOWN.
- **Your name:** Keith Odom (or business name)
- **Organization unit:** (press Enter to skip)
- **Organization:** (your business name or press Enter)
- **City, State, Country:** Fill in your info
- **Key password:** Press Enter to use the same as keystore password

**BACK UP IMMEDIATELY:**
- Copy `~/klo-release.keystore` to a USB drive, cloud storage, or password manager
- Save the password in a password manager (1Password, Bitwarden, etc.)
- **If you lose this file or password, you cannot push updates to the app**

### Step 3D: Configure signing in Android Studio

1. In Android Studio, go to **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle** → Next
3. Click **Choose existing** next to Key store path
4. Navigate to `~/klo-release.keystore`
5. Enter your keystore password
6. Key alias: `klo`
7. Enter key password
8. Click **Next**
9. Select **release** build variant
10. Click **Create**

The `.aab` file will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Step 3E: Upload to Google Play Console

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name:** KLO
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (if using subscriptions through the app)
   - Accept the declarations
4. Click **"Create app"**

**Before you can publish, Google requires you to fill out several sections. Go through each one in the left sidebar:**

#### Dashboard Checklist:
- [ ] **App access** — If the app requires login, provide Google with test credentials
- [ ] **Ads** — Select "No" (unless you have ads)
- [ ] **Content rating** — Fill out the questionnaire (takes 5 min)
- [ ] **Target audience** — Select age groups (18+ if applicable)
- [ ] **News app** — Select "No"
- [ ] **COVID-19 contact tracing** — Select "No"
- [ ] **Data safety** — Describe what data the app collects (see Section 6)
- [ ] **Government apps** — Select "No"
- [ ] **Financial features** — Describe if applicable

#### Store listing:
- [ ] **App name:** KLO
- [ ] **Short description:** (max 80 characters)
- [ ] **Full description:** (max 4000 characters)
- [ ] **App icon:** 512x512 PNG (see Section 5)
- [ ] **Feature graphic:** 1024x500 PNG
- [ ] **Phone screenshots:** Min 2, max 8 (see Section 5)
- [ ] **Tablet screenshots:** Min 1 if tablet-compatible
- [ ] **Privacy policy URL:** Required — must be a public URL

#### Release:
1. Go to **Production** in the left sidebar
2. Click **"Create new release"**
3. Upload the `.aab` file from Step 3D
4. Add release notes (e.g., "Initial release of KLO")
5. Click **"Review release"** → **"Start rollout to Production"**

**Review time:** Google typically reviews in **1-3 days**. You'll get an email when approved.

---

## 4. iOS — Apple App Store

### Step 4A: Open the project in Xcode

```bash
npx cap open ios
```

### Step 4B: Configure signing

1. In Xcode, click **"App"** in the left sidebar (the top-level project)
2. Select the **"App"** target
3. Go to the **"Signing & Capabilities"** tab
4. Check **"Automatically manage signing"** (should already be checked)
5. **Team:** Click the dropdown and select your Apple Developer account
   - If it's not listed, go to Xcode → Settings → Accounts → click "+" → sign in with your Apple ID
6. **Bundle Identifier** should be: `io.keithlodom.klo`
7. Xcode will automatically create a provisioning profile — you should see a green checkmark

### Step 4C: Test on the simulator (recommended first)

1. At the top of Xcode, select a simulator device (e.g., **iPhone 16**)
2. Click the **play button** (or press Cmd+R)
3. The simulator launches — test that KLO works correctly
4. Check login, navigation, assessments, chat, etc.

### Step 4D: Test on a real device (recommended before submission)

1. Connect an iPhone via USB cable
2. The phone appears in Xcode's device dropdown — select it
3. On the iPhone: Settings → Privacy & Security → Developer Mode → turn ON (restart required)
4. Trust the developer certificate on the phone when prompted
5. Click Play in Xcode — the app installs and runs on your phone

### Step 4E: Create the archive

1. At the top of Xcode, change the device to **"Any iOS Device (arm64)"**
   - (Not a simulator — you need this for a real archive)
2. Go to **Product → Archive**
3. Wait for the build to complete (1-3 minutes)
4. The **Organizer** window opens automatically showing your archive

### Step 4F: Upload to App Store Connect

1. In the Organizer window, select your archive
2. Click **"Distribute App"**
3. Select **"App Store Connect"** → Next
4. Select **"Upload"** → Next
5. Leave all options checked (bitcode, symbols) → Next
6. Select your signing certificate → Next
7. Click **"Upload"**
8. Wait for the upload to complete

### Step 4G: Set up the App Store listing

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"** → click the **"+"** → **"New App"**
3. Fill in:
   - **Platforms:** iOS
   - **Name:** KLO
   - **Primary language:** English (U.S.)
   - **Bundle ID:** Select `io.keithlodom.klo` from dropdown
   - **SKU:** `klo-ios-001` (any unique identifier)
4. Click **"Create"**

#### App Information:
- [ ] **Privacy Policy URL:** (required — must be public)
- [ ] **Category:** Lifestyle or Health & Fitness (pick what fits best)
- [ ] **Age Rating:** Fill out the questionnaire

#### Prepare for Submission:
- [ ] **Screenshots:** Upload for each required device size (see Section 5)
- [ ] **Description:** App description
- [ ] **Keywords:** Comma-separated search terms
- [ ] **Support URL:** Website or contact page
- [ ] **App Review Information:**
  - Provide **test login credentials** if the app requires sign-in
  - Add contact info for the review team
  - Add notes explaining what the app does

#### Submit:
1. Under "Build", click **"+"** and select the build you uploaded
2. Fill out all required fields (they'll be highlighted)
3. Click **"Submit for Review"**

**Review time:** Apple typically reviews in **1-3 days**. You may get follow-up questions.

---

## 5. Store Screenshots

Both stores require screenshots at specific sizes. Here's the easiest way to get them.

### Using Simulators/Emulators

**iOS (in Xcode Simulator):**
1. Run the app in the simulator
2. Navigate to the screen you want to capture
3. Press **Cmd+S** — saves a screenshot to your Desktop
4. Required sizes (submit for each):
   - **6.9" display** (iPhone 16 Pro Max): 1320 x 2868
   - **6.5" display** (iPhone 15 Plus): 1290 x 2796
   - **5.5" display** (iPhone 8 Plus): 1242 x 2208
   - **iPad Pro 12.9"**: 2048 x 2732 (if supporting iPad)

**Android (in Android Studio Emulator):**
1. Run the app in the emulator
2. Navigate to the screen you want to capture
3. Click the **camera icon** in the emulator toolbar
4. Required sizes:
   - **Phone:** At least 1080 x 1920 (16:9)
   - **7" tablet:** 1200 x 1920 (if supporting tablets)
   - **10" tablet:** 1600 x 2560 (if supporting tablets)

### What Screens to Screenshot (Minimum 4-6)

1. **Home/Dashboard** — first impression of the app
2. **Assessment screen** — shows the core value proposition
3. **AI Chat** — highlight the AI coaching feature
4. **Results/Insights** — show what users get out of it
5. **Booking** — show the appointment feature
6. **Profile/Settings** — shows personalization

### Pro Tip: Add Marketing Frames

Plain screenshots look basic. Consider adding text captions above each screenshot (e.g., "Discover Your Leadership Style") using tools like:
- **Figma** (free) — https://figma.com
- **Screenshots Pro** (Mac App Store)
- **Canva** — https://canva.com (has app store screenshot templates)

---

## 6. Store Listing Content

Prepare this content before you start the submission process.

### App Name
`KLO`

### Short Description (max 80 chars — Google Play)
`Leadership coaching, AI insights, and personal assessments by Keith Odom`

### Full Description (draft — customize as needed)
```
KLO is your personal leadership development companion, created by Keith Odom.

Features:
- Take research-backed leadership assessments
- Get AI-powered coaching and insights
- Book one-on-one sessions with Keith
- Track your growth over time
- Access exclusive content and resources

Whether you're an emerging leader or a seasoned executive, KLO provides the tools
and guidance you need to level up your leadership journey.
```

### Keywords (iOS — max 100 chars, comma-separated)
`leadership,coaching,assessment,personal development,Keith Odom,executive,growth`

### Privacy Policy
**Required by both stores.** Must be a publicly accessible URL.
If you don't have one, you need to create one at `https://keithlodom.ai/privacy` covering:
- What data you collect (email, name, assessment results)
- How you use it
- Third-party services (Supabase, Stripe, Google/Apple OAuth)
- How users can delete their data

### Data Safety (Google Play)
Google asks specifically what data your app collects. Based on the KLO app:
- **Personal info:** Name, email address (collected via sign-up)
- **Financial info:** Purchase history (Stripe subscriptions)
- **App activity:** Assessment results, chat history
- **Data is NOT sold to third parties**
- **Data can be deleted on request**

### App Review Test Account
Both Apple and Google need a way to test your app. Create a test account:
- **Email:** `review@keithlodom.ai` (or similar)
- **Password:** (a test password)
- Make sure this account has access to all features so reviewers can see the full app

---

## 7. Common Issues & Fixes

### "Gradle sync failed" (Android)
- Make sure Android Studio is up to date
- File → Invalidate Caches → Restart

### "No signing certificate found" (iOS)
- Xcode → Settings → Accounts → make sure your Apple ID is added
- Select your Team in Signing & Capabilities

### "App rejected for missing privacy policy"
- Both stores REQUIRE a privacy policy URL
- It must be live and accessible (not a 404)

### "App rejected — login required but no test credentials"
- In the review notes, provide a test email and password
- Make sure the test account works before submitting

### "White screen on app launch"
- Run `npx cap sync` again
- Make sure `npm run build` completed without errors

### App shows old content after update
```bash
npm run build
npx cap sync
```
Then rebuild in Android Studio / Xcode.

### Universal Links not working
The app has associated domains pointing to `keithlodom.ai`.
For Universal Links to work, you need to host an `apple-app-site-association` file at:
`https://keithlodom.ai/.well-known/apple-app-site-association`
(This can be set up later — it's not required for initial app store submission.)

---

## Quick Reference — The Short Version

```bash
# 1. Build web app
cd ~/klo-app
npm run build
npx cap sync

# 2. Open in IDE
npx cap open android   # Opens Android Studio
npx cap open ios        # Opens Xcode

# 3. Android: Build → Generate Signed Bundle → Upload to Play Console
# 4. iOS: Product → Archive → Distribute → Upload to App Store Connect
```

---

## Checklist Before Submitting

- [ ] Developer accounts created and verified (Google + Apple)
- [ ] Web app builds without errors (`npm run build`)
- [ ] `npx cap sync` runs successfully
- [ ] App tested on emulator/simulator
- [ ] App tested on real device (if available)
- [ ] Android signing keystore created and backed up
- [ ] iOS signing configured in Xcode
- [ ] Privacy policy page is live
- [ ] Store listing text written
- [ ] Screenshots captured (min 4 per platform)
- [ ] Test account created for app reviewers
- [ ] Android AAB uploaded to Google Play Console
- [ ] iOS archive uploaded to App Store Connect
- [ ] Both submissions sent for review

---

*Last updated: March 2026*
*Questions? Text Tim or reach out to your developer.*
