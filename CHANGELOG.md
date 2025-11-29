# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Optimistically update cell values before saving the value to IndexedDB but revert it in case of failures. This makes
  the update faster from a user perspective since we don't wait for it to be committed to IndexedDB first.
- Distinguish the extension installed in dev mode from the one installed from the Chrome Web Store.

## [1.0.1] - 2025-11-28

### Fixed

- Avoid hardcoding function names in code evaluated by `chrome.devtools.inspectedWindow.eval` to account for code
  minification during the build process.

## [1.0.0] - 2025-11-27

### Added

- Display IndexedDB data in a table.
- Enable search and per-column filtering for IndexedDB data.
- Manage column visibility and ordering.
- Add, edit and delete IndexedDB data.
- Use a JSON editor with syntax highlighting for updating JSON data and adding new objects.
- Ensure UI components are accessible.
- Format integers that represent milliseconds since epoch as a datetime using the timestamp datatype.
- Automatically save table settings and last viewed object store for the next time the user opens the extension's panel.
- Automatically update the indexedDB list when the origin of the inspected page changes.
- Use a light or dark theme depending on system settings.
