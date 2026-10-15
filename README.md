# NeroNook website and catalog

Buildless HTML/CSS/JS, original SVG icons and an interactive illustration with synthetic content. No runtime dependency installation is needed. Production is https://neronook.ailuxis.com/, hosted in the independent Vercel `neronook` project. Cloudflare is authoritative DNS; the `neronook` CNAME uses the target Vercel reports, with DNS-only routing. The existing Sites identity in `.openai/hosting.json` is retained as the historical preview; never register a duplicate Site or put credentials in this directory. Source is mirrored to the private `MichaelDanCurtis/neronook-site` repository.

## Prepare a release

1. Finish independent native packaging, tests, Developer ID signing/notarization and Gatekeeper checks. Keep plugin release artifacts outside the host bundle. `scripts/catalog-plugin-release.py` supports flat native apps; plugins with embedded code need their own signing plan. Its generic submission/check operations use the existing `scripts/release.py` receipts.
2. Run `python3 sites/neronook/prepare_catalog.py --sequence NEXT_INTEGER` from the host workspace. Never reuse a sequence with different payload bytes. The generator admits Home Assistant only from its verified receipt; starter artifacts retain their original qualification.
3. Build the stable `scripts/catalog-sign.swift` helper under `build/catalog-tools`, sign it with the selected publisher identity, and use `initialize` only for first setup, then `public-key` to inspect the public half. Missing or inaccessible keys are not replaced by signing. Never regenerate an existing trust key to get past an error. The private key is stored in Keychain and used only in the helper's memory.
4. Run `build/catalog-tools/catalog-sign sign sites/neronook/catalog-source.json sites/neronook/dist/catalog.json`. Confirm the emitted public key matches the app and `dist/site.js`.
5. Copy the exact final notarized host archive and MIT creator kit to `dist/downloads/`. Verify hashes, links, browser behavior and the native library against the published origin. No test records, household state, account files or private plugin binaries belong here.
6. Commit only this website checkout and push `main` to its `github` remote. Vercel builds with `node check-site.mjs` and serves only `dist/`; source, signing helpers and release receipts must not be served. Inspect the resulting production deployment, then verify HTTPS, the signed catalog and exact download hashes at the custom domain. Public beta access was explicitly approved by the owner on October 15. The historical Sites preview remains separate.

## Local preview

`python3 -m http.server 8785 --bind 127.0.0.1 --directory sites/neronook/dist`

Open the printed loopback URL in Codex. Local browser testing is allowed; the production native downloader deliberately requires HTTPS. The DEBUG-only native library preview uses separate temporary stores and does not start the owner's integrations. It is absent from release builds.

## Scope

Direct-download beta, Apple silicon/macOS 14+. Preview listings are not downloadable release claims. No payment processing, public account system, automatic host updater, self-service creator uploads, Windows or Linux build is included. SDK/tools/examples remain MIT; other product licenses are independent. The privacy page identifies ordinary hosting metadata and plugin-specific data paths.
