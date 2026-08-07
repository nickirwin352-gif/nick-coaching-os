# Nick's Coaching OS

A browser-based football coaching workspace for building practice libraries, planning sessions, running sessions from the sideline, reviewing coaching history, and creating pitch diagrams.

## Current architecture

The application remains intentionally deployment-simple: GitHub Pages serves `index.html` and small browser modules from `src/`.

- `index.html` — application markup and the remaining legacy UI/application code.
- `src/firebase-cloud.js` — Firebase/Firestore persistence adapter, extracted from the original monolith.
- `src/session-state.js` — pure session drill/diagram-override state helpers.
- `tests/` — dependency-free Node regression tests for the highest-risk session workflows and structural smoke checks.
- `legacy/` — retained historical HTML snapshots that are not part of the live app.
- `docs/FIRESTORE_SECURITY.md` — security review notes and the required next step before treating cloud data as private.

## Regression tests

Requires a recent Node.js version.

```bash
npm test
```

The tests specifically protect session duplication, session-only diagram persistence/alignment, HTML escaping, and the extracted Firebase module.

## Development rule of thumb

Prefer a small module or pure helper for new behaviour rather than adding another late-file override to `index.html`. When changing session drill order or membership, keep `drills[]` and `diagramOverrides[]` aligned through `src/session-state.js`.
