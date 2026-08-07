# Firestore security review

## What can be verified from this repository

The web app contains a Firebase client configuration and directly reads/writes these Firestore collections:

- `coachingOSPractices`
- `coachingOSSessions`
- `coachingOSSessionBlueprints`
- `coachingOSWordbanks`
- `coachingOSMeta`
- `coachingOSBackups`
- legacy `coachingOS`

The Firebase API key in browser code is not itself a secret. Firestore Security Rules are the control that determines who can read and write this data.

## What cannot be verified from this repository

The deployed Firestore Security Rules are not stored in this repository, and the app currently has no Firebase Authentication flow. That means this codebase alone cannot prove that cloud data is private.

Do **not** deploy a blanket `allow read, write: if true;` rule for these collections.

## Recommended production direction

Before storing data that must be private, add an authentication strategy that works across the coach's devices, then restrict every Coaching OS collection to the intended authenticated user (or an explicit team/organisation membership model). After authentication exists, commit the real `firestore.rules` file to the repository and test it with the Firebase emulator/rules unit tests.

A deny-all rule would be safer than an open rule but would break the current unauthenticated app, so this stability pass deliberately does not change deployed rules blindly.

## Console check to perform

In Firebase Console, open **Firestore Database → Rules** and confirm whether unauthenticated reads/writes are currently permitted. If they are, treat the cloud database as publicly writable until authentication and restrictive rules are deployed.
