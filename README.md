# Chapter & Verse — EPUB Audiobook Reader

A free browser-based audiobook reader for DRM-free EPUB files. Runs on GitHub Pages with no build step, account, or server-side book upload.

## Use

1. Open the deployed website.
2. Select **Open EPUB** and choose a DRM-free `.epub` from your device.
3. Select a voice and reading speed, then press **Play**.
4. Pause or navigate paragraphs and chapters. Your bookmark is saved locally; reopen the same book on your next visit to restore it.

Your EPUB file is processed locally in the browser. ZIP parsing uses JSZip from a public CDN, so an internet connection is needed for that library. Speech uses browser text-to-speech and available system voices. Background or lock-screen playback may not work on all devices.

## Publish

In this GitHub repository, open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, then save. The expected public URL is:

https://gunpowderstudios.github.io/book-reader/

## Limitations

DRM-protected EPUBs aren't supported, and available voices differ by browser and device. The browser may interrupt long passages or playback when the screen is locked. No audiobook MP3 is generated.

## Kokoro AI narration (George)

Choose **★ George — Kokoro AI (British male)** in the Voice menu and press Play. The first time, your browser downloads the free Kokoro model (roughly 80–300 MB depending on device/model format), then generates speech locally. This may take a while, especially on older devices. An internet connection is needed initially for the model and JS library. Subsequent visits may reuse cached weights. The original system speech voices remain available as a faster fallback.

George uses the `bm_george` British voice of Kokoro 82M via `kokoro-js`. Generation is processed in short passages on your own device, not sent to a paid speech API. Model performance and background audio depend on the browser and computer. The first visit after upgrading may need a hard refresh to show the new voice.
