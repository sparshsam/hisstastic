# Play Store Assets Checklist

Use this checklist before submitting HissTastic v1.0.0 to Google Play.

## Required Graphics

- [ ] App icon: 512x512 PNG, 32-bit, no alpha, under 1 MB.
- [ ] Feature graphic: 1024x500 PNG or JPEG, no transparency.
- [ ] Phone screenshots: 6 to 8 images, 16:9 or 9:16 aspect ratio, each 320 px to 3840 px per side.

## Screenshot Set

- [ ] Home screen with Play button and difficulty selector.
- [ ] Classic theme gameplay with snake, food, and obstacles visible.
- [ ] Power-up active gameplay with indicator visible.
- [ ] Game over screen with score and action buttons.
- [ ] Settings screen showing theme and audio controls.
- [ ] Scores screen showing local/cloud toggle.
- [ ] Midnight theme gameplay.
- [ ] Optional: Android install/open screen or another gameplay state.

## Suggested Repo Paths

These assets are release artifacts and should be reviewed before committing. Use:

```text
playstore-assets/icon-512.png
playstore-assets/feature-graphic-1024x500.png
playstore-assets/screenshots/phone-01-home.png
playstore-assets/screenshots/phone-02-gameplay.png
playstore-assets/screenshots/phone-03-powerup.png
playstore-assets/screenshots/phone-04-game-over.png
playstore-assets/screenshots/phone-05-settings.png
playstore-assets/screenshots/phone-06-scores.png
playstore-assets/screenshots/phone-07-midnight-gameplay.png
playstore-assets/screenshots/phone-08-extra.png
```

## Review Notes

- Do not include misleading network/privacy claims in screenshots or captions.
- Do not show debug overlays, browser chrome, emulator controls, or non-production URLs.
- Confirm text is readable on mobile and does not overlap controls.
- Confirm screenshots match the submitted v1.0.0 build.
