# IndexedDB Browser

Chrome extension that adds a DevTools panel to manage IndexedDB data.

## Features

- Search, sort and display IndexedDB data in a table.
- Add, edit and delete IndexedDB data.
- Manage IndexedDB data of other chrome extensions.
- Developed with accessibility in mind.

### Nice Extras

- Automatically display the data of the last viewed object store in the current origin.
- Table columns can be hidden (from the "Table Settings" popover) or re-ordered (via drag and drop).
- Datatypes of each column are auto-detected but can still be changed from the "Table Settings" popover.
- The timestamp datatype can be used to format values that are milliseconds since epoch as a date.
- Table settings are saved automatically to local storage. Saved settings can still be removed using the delete button
  at the bottom of the "Table Settings" popover.
- Copy table data by selecting the cell then "ctrl/cmd + c"
- The shortcut "alt/option + s" can be used to reload the data of the displayed object store.
- "ctrl/cmd + click" or "shift + click" can be used to select multiple objects to be deleted from the object store.
- Double-clicking a table cell or selecting it then starting to type, will allow updating the value for that cell. Press
  "Enter" to save or "Escape" to cancel.
- A JSON data editor is provided to add objects to the store or update the values of JSON columns.
- Automatically update the indexedDB list when the origin of the inspected page changes.
- A light or dark theme is used according to the OS settings.

## Limitations

- Supports object stores
  with [in-line keys](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology#in-line_key)
  only. That's because the value for in-line keys is guaranteed to be a JavaScript object, and that object will most
  likely contain the same properties for each key, making displaying the data in a table viable.
- Only the following datatypes for table columns are supported: string, number, bigint, boolean, date and JSON. Other
  datatypes like sets, maps, typed arrays, ... are not supported, and the corresponding table columns will be marked as
  such and hidden by default. Also, once a column has a specific datatype, values that do not match that datatype will
  be displayed as `undefined`. That means the extension is not the best for dealing with the same property storing
  different datatypes (e.g. mixing numbers and dates).
- The extension is designed to display data for small to medium-sized object stores. Data load will be slower for large
  object stores with hundreds of thousands of objects. You can still limit the number of objects to load from the "Table
  Settings" popover.

## Why create this extension

I was working on another extension that relies on IndexedDB and was frustrated with few things:

- timestamps that are stored as an integer (number of milliseconds since epoch) can't be understood at a glance.
- Inability to create, update or delete objects using the native IndexedDB viewer.
- Display the data in a table given that the objects stored in one object store share the same schema.

Searching the chrome web store yielded few results that ranged from doesn't work at all, to doesn't work for chrome
extensions, to doesn't allow updating specific objects, to rough around the edges.

So, here I am creating this extension with the hope it may help others as it is helping me.

## Technical Notes

- When an object store from either the sidebar or the top dropdown is selected, all the data in that object store is
  loaded. That means if you're working with very large stores, it's better to limit the number of objects displayed (can
  be done from the "Table Settings" popover).
- When the data is loaded, the extension will determine the columns based on the first ten objects. It will also
  auto-detect their datatypes based on the non-null values in the first hundred objects. In case the auto-detected
  datatypes are incorrect, they can be changed from the "Table Settings" popover. Getting the datatypes right is
  important as it affects search, sorting and data updates.
- Once the datatypes are determined, the values for date and bigint columns are serialized to a JSON-compliant type to
  be passed to the extension. Then, the extension converts them back based on the column datatype. The same happens when
  updating column values.
- The extension uses
  [
  `chrome.devtools.inspectedWindow.eval`](https://developer.chrome.com/docs/extensions/reference/api/devtools/inspectedWindow#method-eval)
  to get data from (or store data in) the IndexedDB of the inspected page. Using `eval` was necessary to be able to show
  data from IndexedDBs used by other chrome extensions. But, it also meant that the data passed between the extension
  and the inspected page must be JSON-compliant. Support for passing dates and bigints was added, but other datatypes
  (sets, maps, typed arrays, ...) remain unsupported.
- The flow of passing data between the extension and the inspected page has two steps: evaluate the code for the
  operation (fetch, add, edit, delete), then poll a specific property on the window object of the inspected page to
  check for results. This 2-step flow is due to the async nature of the operations triggered.
- Operation flow:
  - The extension triggers the async operation.
  - The evaluated code will first set the request ID along with the status of the operation in a specific property on
    the window object of the inspected page. This helps the extension check if the operation succeeded or failed and
    avoids concurrency issues.
  - For data fetching operations, a task is scheduled to track how much time has elapsed since the operation started and
    will cancel it if it takes too long.
  - Once the operation succeeds or fails, the status is updated, and the result or an error message is stored in a
    specific property on the window object.
  - After that, the evaluated code will schedule a task to delete the operation's data stored on the window object after
    a set amount of time.
  - On the extension side, once the operation is triggered, the extension will start polling a specific property on the
    window object of the inspected page to check for the operation results.
  - The polling will stop once the results are found or after a set timeout.
- Keeping track of possible datatypes handled by different parts of the code can get hard. So, here's a reference in the
  hope of simplifying/improving it in the future or to help with adding new datatypes. This reference will highlight
  the possible datatypes from getting data from an object store in the inspected page to displaying it in the table in
  the extension's devtools panel:
  - [inspected page] Get data from the object store: the datatypes here correspond to anything supported by IndexedDB
    (i.e. any type supported by `structuredClone`)
  - [inspected page] Auto-detect the supported datatypes:
    - primitive types: string, number, boolean, bigint
    - date objects
    - timestamp: added datatype to represent integers that are milliseconds since epoch. Values are later formatted as
      dates to make them easier to read. A value is auto-detected as timestamp if it's an integer greater than or equal
      to `631152000000` (Jan 1st, 1990).
    - JSON data: values are JSON-compliant objects or arrays.
  - [inspected page] A datatype is auto-detected when 80% of the non-nullish values in the first 100 objects are of that
    type. Otherwise, default to the "Unsupported" datatype (all values will be set as `undefined`)
  - [inspected page] Passing the data between the inspected page and the extension using `eval` requires the data to be
    JSON-compliant. So, date objects are converted to ISO-formatted strings and bigints to strings.
  - [extension] Data received from the inspected page using `eval` and passed as is to AG-Grid's `rowData`.
  - [extension] The `valueGetter` of each table column converts the value from `rowData` to the one that the table uses
    for sorting and per-column filtering:
    - for date columns, ISO-formatted date strings are converted back to date objects
    - for bigint columns, bigint strings are converted back to bigint objects
    - for timestamp columns, integers are converted to date objects
    - for JSON columns, JSON objects/arrays are converted to JSON strings
    - for any datatype, values that do not correspond to the datatype in question are set as `undefined`
  - [extension] The `valueFormatter` converts what's returned by the `valueGetter` to strings that are displayed to the
    user.
  - [extension] `getQuickFilterText` converts what's returned by the `valueGetter` to strings used during the full table
    search. It returns the same value as `valueFormatter`.
  - [extension] During the cell value update flow, the cell editor parses, validates and converts the values to match
    the column datatype. The `onCellEditRequest` first saves the value to IndexedDB, and if that's successful, saves the
    value to `rowData` afterward.
  - [extension] Saving the updated value to IndexedDB includes converting the value to a JSON-compliant value to be
    passed to the inspected page (date objects to date strings, bigint objects to bigint strings, date objects from
    timestamp columns to integers, JSON strings to JSON objects). Next, the inspected page will receive that value and
    convert it to the original datatype for storage in IndexedDB (date strings to date objects and bigint strings to
    bigint objects). After successfully storing the value, the extension will store the JSON-compliant value in
    `rowData`.

## Running the project locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the
   `dist` directory.

4. Build for production:

```bash
npm run build
```

## Project Structure

- `src/devtools/` - Extension devtools panel UI
- `src/popup.html` - Extension popup UI (minimal page directing the user to the devtools panel)
- `manifest.config.js` - Chrome extension manifest configuration

## License

This project is [MIT licensed](LICENSE).
