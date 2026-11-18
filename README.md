# Mathematics Gyaan Maath

Maths teaching workspace for Class 9–12 and IIT JEE, designed for Chrome and S Pen.

Website: https://kunalmath27-blip.github.io/mathematics-gyaan-maath/

## Start a class

1. Choose **Naya page** or **Question / PDF** and write with your S Pen.
2. **Fast pen**, **Mota / patla**, **Dark / light**, colours, erasers and undo are above the board. **Fit width** enlarges a writing page; **Full page** shows everything.
3. **Sabhi tools** opens graphs, geometry, formulas, OCR, backup and recording management.
4. For a replay, choose Mic, start recording, then stop, preview and download. Videos save with the notebook/lesson name; recordings can be searched, filtered and renamed.

## Teaching tools

- Pressure-aware pens and smoothing, favourites, thickness and darkness; S Pen only blocks finger/palm ink by default.
- Incremental live ink, two-finger zoom/pan, lasso, cross-page copy/paste, image crop, object lock and layers.
- Local notebooks/folders, typed-text search, page organizer, removed-page/notebook restore and styled text/maths symbols.
- Own PDF/photo/PYQ question bank; original files remain local. Import PDF ranges such as `1-3,5`, up to ten pages at once.
- Safe equation graphs with variables and reference comparison; circles/sectors with independent copies.
- **JEE conic lab**: ellipse, hyperbola and signed/rotated-axis parabolas, with live parameters, foci, directrices and asymptotes. Standard axis-aligned forms, not an arbitrary implicit-equation solver.
- **Formula library**: 67 common reference formulas with conditions and examples, searchable by class/topic and insertable as editable teaching pages. The chapter index and ten worked examples are not a complete textbook, current verified syllabus or PYQ collection.
- Calculator, ruler/protractor, paper styles, timer, laser and spotlight.

## Printed photo / scan text

**Photo / scan se text** is optional, local Tesseract OCR for printed English or English + Hindi. Enable it once online to cache about 12.5 MB of pinned engine/model files. Images are processed on the device; they are not sent to an AI server or ChatGPT. Editable output must be reviewed before Apply/Graph. Handwriting, fractions, superscripts and complex mathematical layouts may be wrong and need correction.

Selectable PDF text is extracted directly by PDF.js without installing OCR. Scanned PDF pages can use the optional reader. Process one bounded image/page at a time; recognition speed and memory depend on the tablet.

## Backup and sharing

**Teaching backup** creates a `.mgm` file containing notebooks/folders and original question PDFs/photos. Saved videos are optional. The file can be downloaded or shared through supported Android Chrome's share sheet (for example, saved to Drive). This is manual file backup, not automatic cloud synchronization.

Restore validates the archive first and creates additional copies, preserving existing work. The archive limit is 512 MB; large recordings can be downloaded separately. JSON notebook backups, PNG export and print/save PDF remain available.

All data stays in this browser/device. Clearing site data removes local notes, uploads, OCR cache and recordings. Keep backup files and video downloads. To move from another website origin, export there and restore here.

## Offline and online teaching

Open online once in the same browser and wait for **Offline ready**. Local board tools, PDF tools, graphs, formula references, notes and supported recording then work offline. Optional OCR has its own Enable/download step and persistent cache.

For live students, use Meet/Zoom or another meeting app's screen sharing. There is no built-in meeting server. Recording captures this board and your microphone, not remote participants/camera video.

This is an installable web app. Native Samsung Cloud synchronization, Bluetooth Air Actions and Samsung Notes' handwriting recognition are not provided. Hardware pressure, tilt and button data depend on the device/browser; physical Samsung tablet testing is still necessary.

## Hosting and licenses

Static files publish from `main` → `/(root)` on GitHub Pages. Keep `.nojekyll`, local PDF.js/OCR assets and their license files. No build or account is needed to use the app. Heavy `vendor/ocr` files are cached only after explicit Enable; the normal offline app does not download them automatically.

Large OCR cores/models are published as bounded binary pieces under `vendor/ocr/parts/`. The text-reader setup verifies and assembles byte-identical original files into its optional browser cache before use. Those logical core/model URLs are served by the controlling service worker; they need not exist as large physical hosting files. Keep all pieces and `PACKAGE-METADATA.json`.
