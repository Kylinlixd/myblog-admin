# Dynamic media type is automatic

## Goal

Remove the editor's manual `text/image/audio/video` selector. A dynamic is content plus zero or more attachments; users should not need to classify it first.

## Behavior

- The editor exposes one attachment area for upload and file-library selection.
- It accepts images, audio, video, and other files together.
- The submitted compatibility `type` is derived: no media is `text`; otherwise the first attached file's type when it is `image`, `audio`, or `video`; every other case is `text`.
- Attachment previews use each file's own type. Selecting or removing an attachment recomputes the compatibility type and never clears other attachments.
- The backend derives the same compatibility field from `fileIds` when supplied, so direct API callers cannot create a mismatched type.

## Compatibility and validation

- Existing dynamics and the database enum are retained.
- `type` remains in requests and responses for existing list filters and consumers, but is no longer user-authored.
- Dynamics continue to require content; attachments are optional and may be mixed.
- Tests cover mixed attachment selection and backend type derivation.

## Out of scope

- No schema migration.
- No change to server dependencies or runtime environment.
