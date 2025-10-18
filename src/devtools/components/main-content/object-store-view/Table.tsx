import styles from "./Table.module.css";

export default function Table() {
  return (
    <div class={styles.table}>
      <table style={{ "inline-size": "100%" }}>
        <thead>
          <tr>
            <th>id</th>
            <th>firstName</th>
            <th>lastName</th>
            <th>yearOfBirth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>John</td>
            <td>Doe</td>
            <td>1965</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Jane</td>
            <td>Doe</td>
            <td>1981</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Jenna</td>
            <td>Drake</td>
            <td>1985</td>
          </tr>
          <tr>
            <td>4</td>
            <td>James</td>
            <td>Hopkins</td>
            <td>1979</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Bob</td>
            <td>Jefferson</td>
            <td>1976</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
