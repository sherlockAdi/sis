import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      style={{
        width: "200px",
        background: "#f4f4f4",
        padding: "20px",
      }}
    >
      <h3>Menu</h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <Link to="/opd">OPD</Link>
        </li>

        <li>
          <Link to="/ipd">IPD</Link>
        </li>
      </ul>
    </div>
  );
}