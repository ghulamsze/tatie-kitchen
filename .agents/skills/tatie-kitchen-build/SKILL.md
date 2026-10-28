---
name: tatie-kitchen-build
description: Comprehensive architecture, design system, and engineering guidelines for the Tati’e Kitchen POS & Owner application across Tablet, Android phone, iOS, and Web platforms using React, TypeScript, Supabase, and Capacitor.
---

# Skill: Tati’e Kitchen POS & Mobile Platform

This skill is the single unified source of truth for architecture, design tokens, UI components, database schemas, hardware peripherals, and multi-platform build workflows across POS Tablet (Landscape), Mobile Phone (Portrait), iOS, and Web.

---

## 1. Core Architecture & Technology Stack

| Layer | Technology | Decision & Rationale |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 + TypeScript (Strict) + Vite | High-performance SPA with complete type safety. Single codebase across all platforms. |
| **Styling** | Vanilla CSS Design Tokens (`src/design/tokens.css`) | Zero CSS framework bloat (no Tailwind). Custom tokens provide precision control. |
| **State Management** | Zustand (`src/stores/`) | Lightweight stores for cart, cashier shifts, shop settings, sync queues, and device detection. |
| **Database & Auth** | Supabase (PostgreSQL, Storage, Realtime) | Cloud database hosted in Singapore region (`ap-southeast-1`), closest to target deployment (Makassar/WITA). |
| **Android Target** | Capacitor Android Native Project (`android/`) | Native wrapper compiling to `Tatie-Kitchen-v0.1.0.apk` via Gradle 8.14.3 + AGP 8.13.0. |
| **iOS Target** | Capacitor iOS Native Project (`ios/App/`) | Xcode workspace supporting iOS 15+ devices, notch/Dynamic Island safe areas, and WebKit PWA. |
| **Thermal Printing** | Custom Capacitor SPP Plugin + Web Bluetooth | Direct binary ESC/POS byte streaming to 58mm/80mm thermal printers (VSC MP-58X). |
| **CI / CD Automation** | GitHub Actions (`.github/workflows/build-mobile.yml`) | Automated cloud builds for Android APK and iOS IPA on git push. |

---

## 2. Business Entity & Payment Information

- **Owner & Admin Accounts (Backoffice Access):**
  - Admin 1: `ghulamsze@gmail.com`
  - Admin 2: `robertusamaresi@gmail.com` (Business Owner / Lead Cashier)
  - *Tablet POS Behavior:* The tablet cash register operates kiosk-style without requiring email/password authentication; cashiers quickly switch shifts via avatar pin/selection.
- **Official Settlement Bank Account:**
  - Bank: **Bank Kaltimtara**
  - Account Number: **1747037252**
  - Account Holder: **Hartati Jahri**
- **Official QRIS Code:**
  - Merchant Name: **TATIS CAFE DAN RESTO, TLN**
  - NMID: **ID1026489183222**
  - Clean Asset: `/assets/images/qris-clean.png` (frame-free transparent render)
- **Store Timezone:** `Asia/Makassar` (WITA, UTC+8). All transaction timestamps and reports format in WITA.

---

## 3. Design System & Visual Tokens

The visual foundation is defined in `src/design/tokens.css` and `src/design/components.css`.

### 3.1 Typography Scale
- **Font Family:** `Plus Jakarta Sans` bundled locally via `@fontsource/plus-jakarta-sans` (Weights: `500`, `700`, `800`). Fallback: `system-ui, sans-serif`.
- **Text Tokens:**
  - `--t-xs` (12px / 16px LH): Date labels, badge times, receipt lines.
  - `--t-sm` (14px / 20px LH): Filter chips, cart row items, notes, toasts.
  - `--t-md` (16px / 24px LH): Default body, primary inputs, keypad numbers, buttons.
  - `--t-lg` (20px / 28px LH): Section card titles, receipt change totals.
  - `--t-xl` (32px / 40px LH): Major screen titles, Home KPI totals.
  - `--t-2xl` (44px / 52px LH): Total payment due, profile cashier modal headers.
  - `--t-3xl` (64px / 72px LH): Table number callout, receipt giant stamp.
- **Contrast Ratios:** Text $\ge$ 24px must meet 3:1 minimum contrast; text < 24px must meet 4.5:1.

### 3.2 Spacing, Radii & Controls
- **Grid Discipline:** All padding, margins, gaps, widths, and heights must be **multiples of 4px**.
- **Touch Targets:** Minimum touchable surface is **44px x 44px**.
- **Control Heights:** `--c-sm` = 40px, `--c-md` = 48px, `--c-lg` = 56px (Standard primary action button height).
- **Corner Radii:**
  - `--r-sm` (12px): Menu group icons, table badges.
  - `--r-md` (16px): Inputs, keypad buttons, selector items.
  - `--r-lg` (24px): Acrylic panels, menu category containers, cart panels.
  - `--r-xl` (32px): Modal dialog sheets, cash register summary card.
  - `--r-pill` (9999px): Floating navbar pills, status banners, quick chips.

### 3.3 Materials & Glassmorphism
1. **Liquid Glass (`.g-liquid`):**
   - Background: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08))`.
   - Backdrop filter: `blur(24px) saturate(190%) brightness(1.06)`.
   - Border: `1px solid rgba(255,255,255,0.16)`.
   - Inset specular shadow: `inset 0 1px 0 rgba(255,255,255,0.38)`.
   - Usage: Floating navigation bar, table pills, price tags, and avatar edit trigger buttons.
2. **Frosted Acrylic (`.g-acrylic`):**
   - Backdrop filter: `blur(28px) saturate(175%) brightness(1.03)`.
   - Border: `1px solid rgba(255,255,255,0.09)`.
   - Usage: Main cashier bill panel, order detail sheets, KPI cards.
3. **Flat Controls (`.ctl-flat`):**
   - Crisp border without backdrop blur for high-contrast scrolling lists.
4. **Dialog Animation (`.tk-dialog-zoom-out`):**
   - Smooth transform originating from target point (`scale(0.85)` to `scale(1)`) with `cubic-bezier(0.16, 1, 0.3, 1)`.

### 3.4 Color Themes & Single-Accent Rule
- **Primary Themes:** Obsidian (Deep Dark & Pure Light modes), Emerald, Indigo, Warm Stone.
- **Highlight Rule:** Only **one prominent lime button** per active transaction view to guide immediate cashier action. Secondary actions use subtle acrylic or ghost buttons.

---

## 4. Multi-Platform Form Factors & Device Detection

### 4.1 Form Factors
1. **POS Tablet Counter (Landscape 1024 x 640):**
   - Active when screen shortest width $\ge$ 600dp.
   - Dual-pane layout: menu grid on the left (65%), real-time order cart & checkout summary on the right (35%).
   - One-tap fast table grid selection (Meja 1-15, Bungkus/Takeaway).
2. **Owner & Companion Phone (Portrait < 600dp):**
   - Real-time revenue KPI banner (Total Omzet, Transaction Count, Average Basket).
   - Cash vs QRIS settlement breakdown.
   - Live Supabase Realtime order stream (new transactions appear instantly without page pull-to-refresh).
   - Cashier management & menu item availability toggle.
3. **iOS (iPhone & iPad):**
   - Native Capacitor shell with dynamic top notch / pill inset handling (`env(safe-area-inset-top)`).
   - System dark/light mode synchronization.
   - Safari PWA "Add to Home Screen" support with standalone display.
4. **Windows Desktop Development Frame:**
   - On Windows desktop browsers, development controls (`WebDevControls`) provide live viewport switching between Tablet, Android Phone, and iOS iPhone.
   - **CRITICAL RESTRICTION:** Development toggle controls must **only render on Windows desktop environments** (`device.platform === 'windows'` or `isWindowsDesktop`). They must **never** appear on actual Android tablets/phones, iPhones, iPads, or inside native apps.

### 4.2 Device Detection Hierarchy (`src/lib/device/detect.ts`)
1. **Manual Override:** URL query `?device=tablet|phone|laptop` or `localStorage['tk-device']`.
2. **Capacitor Native Bridge:** `Capacitor.isNativePlatform()` and `@capacitor/device`.
3. **Client Hints:** `navigator.userAgentData`.
4. **User-Agent String Analysis:** Screen width threshold (`>= 600dp` = tablet, `< 600dp` = phone).

---

## 5. Unified Image Handling & Hold Flow

Any editable image in the application (Owner profile photo, cashier avatars, menu food items) adheres to this standardized interaction:

1. **Avatar Edit Button:**
   - Located at the bottom-right corner of the avatar (`bottom: -4px; right: -4px`).
   - Styled as a sleek liquid glass frosted acrylic circle (`g-liquid`).
   - Replaces all legacy solid camera/pencil icons for visual consistency.
2. **Action Modal First (Never Auto-Open File Picker):**
   - Long-pressing (holding) the avatar OR tapping the bottom-right edit button triggers the `PhotoActionsDialog`.
   - The dialog displays **pure icon buttons** without redundant text labels:
     - **Eyes Icon:** Opens high-resolution lightbox preview.
     - **Pencil/Edit Icon:** Launches device photo gallery / camera file picker.
     - **Trash Icon:** Removes photo and reverts to initial initials/placeholder.
     - **Add Icon:** Displayed when no photo exists yet (Trash & Edit are hidden).
     - **Close/Cancel Icon:** Dismisses the dialog.
3. **Lightbox Image Preview:**
   - Inside the full-screen preview lightbox, tapping the edit button re-opens the action dialog rather than bypassing directly to the gallery.
4. **Image Cropping:**
   - Uploaded photos are cropped to a clean **1:1 square aspect ratio** before uploading to Supabase Storage.
5. **Defensive Storage Recovery:**
   - Any broken image or 400 Bad Request error triggers `<img onError>` to instantly purge the missing URL from `localStorage` without generating network loop retries.

---

## 6. Hardware Integration: Bluetooth Thermal Printing

- **Driver:** Integrated SPP RFCOMM driver (`BluetoothPrinterPlugin`) and Web Bluetooth API.
- **Specification:** 58mm / 80mm ESC/POS paper format (203 DPI, 384 dots/line).
- **Receipt Structure:**
  1. Store Header: "Tati’e Kitchen" + Address / WhatsApp.
  2. Large Daily Queue Number: `#001`, `#002`, etc. centered in double-height bold text.
  3. Cashier name, table number / Takeaway tag, and timestamp (WITA).
  4. Itemized table: Item name, quantity, unit price, line subtotal, customer notes.
  5. Totals: Subtotal, discounts, Grand Total, payment method (Cash + Change / QRIS).
  6. Footer greeting.
- **Auto-Print:** Option in Account screen to automatically fire print jobs immediately upon successful transaction completion.

---

## 7. Database, RLS & Offline Synchronization

- **Migrations:** All database modifications must be authored as incremental SQL files in `supabase/migrations/`. Never modify older migrations retroactively.
- **System Table Safety:** Do not execute `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;` as it causes Postgres error `42501` (table is owned by `supabase_storage_admin`).
- **Security Definer Functions:** Cashier PIN verification, shift openings/closings, and owner profile modifications are executed via secure RPCs (`verify_cashier_pin`, `upsert_shop_settings`).
- **Offline Outbox (`syncQueueStore`):**
  - If network disconnects during busy hours, transactions complete locally.
  - Transactions receive consecutive queue numbers and persist in IndexedDB / local storage.
  - Once connectivity resumes, background worker flushes the outbox to Supabase without cashier friction.

---

## 8. Mobile Compilation & Release Standards

### Android Build
- **JDK:** Requires JDK 17.
- **Gradle:** Wrapper `gradle-8.14.3` with Android Gradle Plugin `com.android.tools.build:gradle:8.13.0`.
- **Target SDK:** Compile SDK 36, Target SDK 36, Min SDK 24 (Android 7.0+).
- **Security:** `android:allowBackup="false"` in `AndroidManifest.xml` prevents data exfiltration.
- **Command:**
  ```powershell
  npm run build
  npx cap sync android
  .\android\gradlew.bat -p android assembleDebug
  ```

### iOS Build
- **Prerequisites:** macOS with Xcode 15+ or GitHub Actions macOS runner.
- **Command:**
  ```bash
  npm run build
  npx cap sync ios
  npx cap open ios
  ```

### Verification Checklist Before Git Commit
1. `npm run test` (`tsc --noEmit`) passes with zero errors.
2. `npm run build` generates production bundle without warnings.
3. Clean git workspace without leftover temporary debug files.
