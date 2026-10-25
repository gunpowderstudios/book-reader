# Optional reading-position cloud sync

EPub Reader can sync **chapter and paragraph only** via Supabase. EPUBs, book text, and audio remain on each device. This is **not yet enabled** until a Supabase project is supplied.

## Activate

1. Create a Supabase project at https://supabase.com, then open **SQL Editor** and run `cloud-sync-schema.sql`.
2. In **Authentication > Providers > Email**, enable email authentication (magic link or OTP email template linking back to the site).
3. In **Authentication > URL Configuration**, set Site URL to `https://gunpowderstudios.github.io/book-reader/` and add that exact URL to **Redirect URLs**.
4. In **Project Settings > API**, copy the project URL and **publishable/anon** key into `cloud-sync-config.js`. This client key is intended to be public; **never use the service_role/secret key**.
5. Commit the config; open the site on both devices, sign in using the same email, and load the same EPUB on both. On opening the book, the newest synced position is restored. Progress uploads after a short pause.

## Notes

- Users must sign in on each device and have the same EPUB locally; books are identified by a hash of the EPUB file bytes.
- Safari private browsing, offline sessions and email link delivery may prevent sync; local positions still work.
- Only book hashes, chapter, paragraph, user IDs, and update timestamps are stored remotely. Book titles and contents are not sent.
- Email links may open the default browser. Open them in the browser that will be used for reading. Test this flow before production.
- Remote writes use Supabase Row Level Security policies keyed to the authenticated user's UID.
- No automatic account or cloud setup is performed by this repository.
