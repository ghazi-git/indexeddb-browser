import styles from "./ColumnsDatatypeNotes.module.css";

export default function ColumnsDatatypeNotes() {
  return (
    <details class={styles.notes}>
      <summary>Notes about the table</summary>

      <ul>
        <li>
          Columns datatypes are auto-detected based on the data in the first 100
          rows. If that is not working as expected, you can select the correct
          datatype from the dropdown.
        </li>
        <li>
          The "Raw Data" datatype shows data as it is stored in the object
          store. This is used when the column holds objects, arrays or a mix of
          primitive datatypes.
        </li>
        <li>
          The "Unsupported" datatype refers to a column holding data of a type
          that is not supported by the extension (maps, sets, ...). The column
          is hidden by default and its value is set to <code>undefined</code>.
        </li>
        <li>
          The other datatypes will show <code>undefined</code> if the value does
          not correspond to the datatype selected.
        </li>
        <li>
          The "Timestamp" datatype represents unix timestamps in milliseconds
          that are shown as a datetime string. If you don't like displaying a
          datetime string, just change the column datatype to "Number" or "Raw
          Data".
        </li>
        <li>Any column value formatted as a datetime string is in UTC.</li>
        <li>
          Booleans and numbers are displayed in blue, while bigints are in green
          (similar to their display in the browser console).
        </li>
        <li>
          Column filtering excludes <code>null</code> and&nbsp;
          <code>undefined</code> values from the results. You can use the
          "Blank" filter to show rows with only <code>null</code> or&nbsp;
          <code>undefined</code> for a specific column.
        </li>
      </ul>
    </details>
  );
}
