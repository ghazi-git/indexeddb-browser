# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.3.0] - 2026-03-31

### Added

- Track the history of selected object stores and add shortcuts to move between them using:
  - Ctrl+Alt+LeftArrow/RightArrow to go to the previous/next object store.
  - back and forward buttons of the mouse (if the mouse has them).
- Preserve sorting and column filters when reloading the table data from the header.
- Add the page size to table settings to be saved and used the next time the store data is loaded.

### Changed

- Dependencies upgrades.
- Refactor bigint columns support to use the newly introduced bigint datatype in ag-grid.

### Fixed

- Catch all errors that happen when creating/updating/deleting indexedDB data and display them to the user.
- Reset the table settings when the user changes the object store and there are no saved table settings.
- Completely ignore canceled data-load requests.

## [1.2.0] - 2025-12-11

### Added

- Allow bulk updating the selected objects from the table.

## [1.1.2] - 2025-12-10

### Fixed

- Load object store settings from local storage whenever the object store changes.

## [1.1.1] - 2025-12-10

### Fixed

- Enable word wrapping in the JSON editor.

## [1.1.0] - 2025-11-30

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
