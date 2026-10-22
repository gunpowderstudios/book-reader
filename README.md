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
