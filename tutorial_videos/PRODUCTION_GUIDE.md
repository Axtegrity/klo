# KLO Admin Tutorial Production Guide

## ✅ What's Ready

All tutorial content is prepared and ready for screen recording:

- **13 markdown scripts** — `/Users/timothyadams/klo-app/docs/tutorials/`
- **13 voiceover audio files** — `/Users/timothyadams/klo-app/tutorial_videos/`
- **Complete README index** — `/Users/timothyadams/klo-app/docs/tutorials/README.md`

## 📹 How to Produce the Videos

### For Each Tutorial:

1. **Open the audio file** in your media player (or use `afplay tutorial_XX_audio.aiff`)
2. **Start screen recording** (use QuickTime, OBS, or any screen recorder)
3. **Play the audio** while recording
4. **Follow the tutorial script** in `/docs/tutorials/` — click through the steps as the narration guides you
5. **Stop recording** when audio ends
6. **Export as MP4** and save to `tutorial_videos/`

### macOS Quick Method:
```bash
# Play audio while recording with ffmpeg
afplay /Users/timothyadams/klo-app/tutorial_videos/tutorial_01_audio.aiff &
ffmpeg -f avfoundation -i "Capture screen 0" output.mp4
```

## 📋 Tutorial Files Mapping

| Tutorial | Script | Audio | Duration |
|----------|--------|-------|----------|
| 01 | `klo_tutorial_01_getting_started.md` | `tutorial_01_audio.aiff` | 5 min |
| 02 | `klo_tutorial_02_home_page_text.md` | `tutorial_02_audio.aiff` | ~10 min |
| 03 | `klo_tutorial_03_home_page_image.md` | `tutorial_03_audio.aiff` | ~8 min |
| 04 | `klo_tutorial_04_vault_new_item.md` | `tutorial_04_audio.aiff` | ~10 min |
| 05 | `klo_tutorial_05_vault_edit_hide_archive.md` | `tutorial_05_audio.aiff` | ~8 min |
| 06 | `klo_tutorial_06_create_event.md` | `tutorial_06_audio.aiff` | ~12 min |
| 07a | `klo_tutorial_07a_event_setup_sessions.md` | `tutorial_07a_audio.aiff` | ~10 min |
| 07b | `klo_tutorial_07b_live_conference.md` | `tutorial_07b_audio.aiff` | ~10 min |
| 08 | `klo_tutorial_08_push_notification.md` | `tutorial_08_audio.aiff` | ~5 min |
| 09 | `klo_tutorial_09_booking_inquiries.md` | `tutorial_09_audio.aiff` | ~7 min |
| 10 | `klo_tutorial_10_brand_colors_features.md` | `tutorial_10_audio.aiff` | ~8 min |
| 11 | `klo_tutorial_11_user_accounts.md` | `tutorial_11_audio.aiff` | ~8 min |
| 12 | `klo_tutorial_12_surveys.md` | `tutorial_12_audio.aiff` | ~10 min |

**Total production time: ~101 minutes of narration across all 13 tutorials**

## 🎯 Recommended Production Order

1. **Phase 1** (Most frequent tasks): Tutorials 01–05
2. **Phase 2** (Events): Tutorials 06–07a–07b
3. **Phase 3** (Operations): Tutorials 08–09
4. **Phase 4** (Admin): Tutorials 10–12

## 💡 Tips

- Record at **1920×1080 resolution** minimum for clarity
- Use a **quiet room** to avoid background noise (the voiceovers are already clean)
- **Follow the script timing** — narration matches the step flow
- **Pause between steps** if needed — the audio has natural pauses built in
- Save final videos as **MP4 (H.264)** for web playback

## 🚀 Next Steps

1. Choose a tool: QuickTime Screen Recording, OBS, ScreenFlow, or Camtasia
2. Start with Tutorial 01 as a test run
3. Record all 13 in sequence
4. Upload to your hosting platform

---

Generated: 2026-06-01 | All content ready for production
