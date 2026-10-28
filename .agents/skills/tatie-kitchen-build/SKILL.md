---
name: tatie-kitchen-build
description: Working rules and guidelines for developing and maintaining the Tati’e Kitchen POS application across Tablet, Android phone, iOS, and Web platforms using React, TypeScript, Supabase, and Capacitor. Use whenever writing, editing, or testing code, UI designs, database schemas, or mobile builds for this repository.
---

# Skill: Building Tati’e Kitchen

## When to Use

Use this skill for every engineering task on the Tati’e Kitchen repository: screens, UI components, design tokens, device detection and responsiveness, Supabase database schemas and RLS, web bundling, Capacitor mobile builds (Android APK and iOS), and testing.

## Sources of Truth (Review Before Modifying)

1. `docs/design.md`: Core design tokens, sizing (multiples of 4px), typography scale, and color palettes.
2. `docs/arsitektur.md`: Architectural decisions, device detection hierarchy, and backend integration.
3. `reference/tati_e-kitchen-final-preview.html`: Visual layout and behavioral reference.

If requirements conflict or are ambiguous, ask the project owner for clarification rather than making unverified assumptions.

## Target Platforms & Form Factors

1. **POS Tablet (Landscape 1024 x 640)**: Primary cashier checkout counter workstation. High-density grid, fast numeric entry, split payment (Cash and QRIS), and receipt generation.
2. **Android Phone (Portrait)**: Owner and mobile cashier companion interface. Food catalog management, cashier shift assignments, profile photo editing with 1:1 cropping, and inventory availability toggles.
3. **iOS (iPhone & iPad)**: Native Capacitor iOS application target with safe area insets, iOS haptics, and system theme adaptation.
4. **Desktop Web Development**: Development preview on Windows with simulated device frames and dev controls.

## Development Rules

1. **Smallest Complete Change**: Follow the principle of lean engineering (*ponytail*). Solve problems cleanly with minimal code additions, reusing existing tokens and stores.
2. **Multi-Platform Consistency**:
   - Device switching controls (Tablet, Android, iOS) are strictly restricted to Windows desktop development and must **never** be displayed on actual mobile, tablet, or native devices.
   - All interactive image dialogs (avatar, menu photos) must feature pure icon buttons (**Eyes** for viewing, **Edit/Pencil** for changing, **Trash** for deleting, **Add Photo** when empty, and **Cancel**).
   - Use the signature *Liquid Glass Frosted Acrylic* (`g-liquid`) styling and smooth zoom-out dialog animations (`.tk-dialog-zoom-out`).
3. **Database & Migrations**:
   - Never alter or overwrite existing historical migrations. Always write schema changes, RLS updates, and functions as new sequential migrations under `supabase/migrations/`.
   - Keep system tables (`storage.objects`) intact without executing forbidden `ALTER TABLE` statements.
4. **Thermal Printer Integration**:
   - Bluetooth ESC/POS thermal printer support (58mm and 80mm) operates through Capacitor native Bluetooth Serial and browser Web Bluetooth API.

## Code Standards

- **TypeScript Strict**: Full type safety. No unannotated `any` types.
- **Design System First**: Use only design tokens from `src/design/tokens.css`. Never hardcode raw hex colors, font sizes, or ad-hoc margins in component JSX.
- **Typography & Sizing**: Plus Jakarta Sans font bundled locally (no runtime external CDN dependency). Spacing and dimensions must be multiples of 4px. Minimum touch target size is 44px.
- **Device Detection**: All platform and form factor detection must go through `src/lib/device`. Do not parse raw `navigator.userAgent` directly within UI components.
- **Supabase Integration**: Communicate via `src/lib/supabase/client.ts` and Zustand stores in `src/stores/`. UI components must never call the Supabase client directly.
- **Localization**: UI text is in standard, concise Indonesian (Bahasa Indonesia baku). Currency formatting uses Indonesian Rupiah (`formatRupiah` / `Rp80.000` from integer amounts). Timezone is pinned to store settings (`Asia/Makassar` / WITA).

## Security Discipline

- **No Hardcoded Secrets**: The service-role secret key must never appear in client bundles, source code, or version control. Only public Anon keys are permitted on client builds.
- **Row Level Security (RLS)**: RLS must remain enabled on all database tables. Public anon mutation privileges must be guarded or routed through security-definer Postgres RPC functions.
- **Mobile Hardening**: Android application backup is explicitly disabled (`android:allowBackup="false"`) in `AndroidManifest.xml` to prevent unauthorized ADB data extraction.
- **Graceful Error Handling**: Broken avatar URLs or storage missing errors (400 Bad Request) must be caught by `<img onError>` handlers and immediately pruned from local cache without triggering network loops.

## Phase Delivery Checklist

Before concluding any development phase:
1. `npm run test` (`tsc --noEmit`) passes with zero type errors.
2. `npm run build` succeeds cleanly with production bundle optimization.
3. Relevant mobile sync commands are executed: `npx cap sync android` and `npx cap sync ios`.
4. Git commit message follows standard semantic conventions with clear descriptions.
