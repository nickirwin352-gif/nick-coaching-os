# Coaching loop and reliable saving

Refresh Coaching OS on both phone and laptop before continuing to edit. Older open versions do not use the new outbox and conflict protocol.

## Working sequence

1. Choose the phase, principle and sub-principle. Record the observation or clip that explains the objective and the behaviour you expect to see.
2. Add practices. Open **Actual session prescriptions** to set players, area, duration, work/rest/rotation, equipment and today's focus. Missing setup is flagged without preventing a draft save.
3. Add roles, a recognition trigger and an alternative where they help delivery. Saved principle delivery details can fill empty fields without overwriting the current plan.
4. Deliver using the session's setup and short cues. Each practice occurrence stores its own snapshot, so later template changes do not rewrite its saved setup. Duplicate occurrences have independent prescriptions.
5. Review what was observed, who had opportunities and whether players acted independently. Record a next action and revisit date. Leave match transfer as not observed until there is evidence.
6. Open **Coaching pathway** to use a next action in a new plan, complete or reopen it, and maintain proportionate individual/unit goals and observation evidence.

The practice editor's **Practice family, variation and delivery cues** section groups related practices without deleting or combining them. Create a variation, change its constraint or setup and save it under its own practice ID. Short delivery cues are separate from expanded coaching points.

## Saving and recovery

- Changes enter a persistent local outbox before a save is acknowledged on the device. An unavailable cloud connection retries with backoff. An earlier request cannot overwrite a later queued edit.
- Firestore transactions merge changes to different record fields. Competing changes to the same field, including diagram arrays, are retained as conflicts. **Cloud / Backups → Sync and recovery → Edit conflicts** shows the alternatives. Keeping local changes retains non-conflicting remote fields; choosing the cloud record discards local changes to that record.
- Cloud synced means every queued operation has been acknowledged, not that a separate backup exists. The header and save feedback use the same queue status.
- Browsers with Web Locks allow one editing tab per origin. Close the other Coaching OS tab to transfer ownership. Independent devices still work concurrently. Browsers without Web Locks rely on transactional cloud conflict checks and do not have the same local multi-tab protection.
- Learning-field edits retain a recoverable local draft, including the surrounding planner form and diagram overrides. This is not a general autosave of every unsaved editor field.
- JSON exports use a download link instead of placing a large backup into the page. Restore validates the workspace and retains a local pre-restore copy.
- Suspected automatic classifications are marked for review. The word “corner” in a grid description no longer implies a set play. Existing manual phase/principle/format selections remain authoritative.

## Validation and limits

238 automated tests pass, including actual adapter transaction behaviour, interrupted/newer edits, conflicts, stale hydration, outbox restart recovery, nested bank edits, session loading, prescriptions, duplicate occurrences, short-cue escaping and retry backoff. All 68 JavaScript modules and inline scripts parse successfully.

Automated tests use fixtures; no production coaching records are changed for testing. Physical phone/laptop concurrent editing remains a real-device acceptance check. Firestore access rules and authentication are unchanged by this release. Escaping rendering paths is not a replacement for server access control.
