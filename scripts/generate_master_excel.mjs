import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());

function walk(dir, predicate) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, predicate));
    else if (predicate(p)) out.push(p);
  }
  return out;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cellXml(v) {
  if (v == null) return `<Cell><Data ss:Type="String"></Data></Cell>`;
  if (typeof v === "number" && Number.isFinite(v)) return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
  if (typeof v === "boolean") return `<Cell><Data ss:Type="Boolean">${v ? 1 : 0}</Data></Cell>`;
  return `<Cell><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`;
}

function sheetXml(name, rows) {
  const xmlRows = rows
    .map((r) => `<Row>${r.map(cellXml).join("")}</Row>`)
    .join("");
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${xmlRows}</Table></Worksheet>`;
}

function extractSqlInventory(sqlText, file) {
  const tables = [];
  const procs = [];

  const tableRe = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([A-Z0-9_]+)\s*\(/gi;
  let m;
  while ((m = tableRe.exec(sqlText))) tables.push({ table: m[1], file });

  const procRe = /CREATE\s+PROCEDURE\s+([A-Z0-9_]+)\s*\(/gi;
  while ((m = procRe.exec(sqlText))) procs.push({ proc: m[1], file });

  return { tables, procs };
}

function extractInsertRows(sqlText, fileHint = "") {
  const rows = [];
  const insertRe = /INSERT\s+INTO\s+([A-Z0-9_]+)\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*?);/gi;
  let m;
  while ((m = insertRe.exec(sqlText))) {
    const table = m[1];
    const cols = m[2].replace(/\s+/g, " ").trim();
    const valuesBlock = m[3].trim();
    // Split tuples roughly by "),", keeping the content readable (not strict SQL parsing).
    const tuples = valuesBlock
      .split(/\)\s*,\s*\(/g)
      .map((t) => t.replace(/^\(/, "").replace(/\)$/, "").trim())
      .filter(Boolean);
    for (const t of tuples) {
      rows.push({ table, columns: cols, values: t, source_file: fileHint });
    }
  }
  return rows;
}

function extractControllerInventory(tsText, file) {
  const base = (() => {
    const m = tsText.match(/@Route\(\s*'([^']+)'\s*\)/);
    return m ? m[1] : "";
  })();

  const tag = (() => {
    const m = tsText.match(/@Tags\(\s*'([^']+)'\s*\)/);
    return m ? m[1] : "";
  })();

  const endpoints = [];
  const re = /@(Get|Post|Put|Delete|Patch)\(\s*(?:'([^']*)')?\s*\)\s*[\r\n]+(?:@[\s\S]*?[\r\n]+)*?\s*public\s+(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/g;
  let m;
  while ((m = re.exec(tsText))) {
    const method = m[1].toUpperCase();
    const sub = (m[2] ?? "").trim();
    const fn = m[3];
    const fullPath = `/${[base, sub].filter(Boolean).join("/")}`.replace(/\/+/g, "/");
    endpoints.push({ method, path: fullPath, controller: path.basename(file), fn, tag, file });
  }
  return endpoints;
}

function extractFrontendRoutes(tsxText) {
  const out = [];
  const re = /<Route\s+path="([^"]+)"\s+element=\{<([^>\s]+)[^>]*>\}\s*\/?>/g;
  let m;
  while ((m = re.exec(tsxText))) out.push({ path: m[1], component: m[2] });
  return out;
}

function parseMenuSeed(sqlText) {
  const rows = [];
  const valueBlocks = [];
  const insertRe = /INSERT\s+INTO\s+AUTH_U02_menus[\s\S]*?VALUES([\s\S]*?)(?:ON\s+DUPLICATE|\-\-\s+Give\s+Admin|$)/gi;
  let m;
  while ((m = insertRe.exec(sqlText))) valueBlocks.push(m[1]);

  for (const block of valueBlocks) {
    const tuples = [];
    let i = 0;
    while (i < block.length) {
      if (block[i] !== "(") {
        i++;
        continue;
      }
      let depth = 0;
      let inQuote = false;
      let buf = "";
      for (; i < block.length; i++) {
        const ch = block[i];
        buf += ch;
        if (ch === "'" && block[i - 1] !== "\\") inQuote = !inQuote;
        if (!inQuote && ch === "(") depth++;
        if (!inQuote && ch === ")") {
          depth--;
          if (depth === 0) {
            tuples.push(buf);
            i++;
            break;
          }
        }
      }
    }

    for (const t of tuples) {
      const inner = t.trim().slice(1, -1);
      const fields = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === "'" && inner[i - 1] !== "\\") {
          inQuote = !inQuote;
          cur += ch;
          continue;
        }
        if (!inQuote && ch === ",") {
          fields.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      fields.push(cur.trim());

      const norm = (v) => {
        if (v == null) return "";
        const s = String(v).trim();
        if (s.toUpperCase() === "NULL") return "";
        if (s.toUpperCase() === "TRUE") return true;
        if (s.toUpperCase() === "FALSE") return false;
        if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1);
        return s;
      };

      if (fields.length >= 7) {
        rows.push({
          menu_name: norm(fields[0]),
          menu_code: norm(fields[1]),
          parent_menu_id_expr: norm(fields[2]),
          menu_path: norm(fields[3]),
          icon: norm(fields[4]),
          menu_order: norm(fields[5]),
          status: norm(fields[6]),
        });
      }
    }
  }

  return rows;
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function main() {
  const sqlFiles = walk(path.join(ROOT, "sql"), (p) => p.endsWith(".sql"));
  const controllerFiles = walk(path.join(ROOT, "src", "controllers"), (p) => p.endsWith("Controller.ts"));

  const tables = [];
  const procs = [];
  for (const f of sqlFiles) {
    const text = fs.readFileSync(f, "utf8");
    const inv = extractSqlInventory(text, path.relative(ROOT, f));
    tables.push(...inv.tables);
    procs.push(...inv.procs);
  }

  const endpoints = [];
  for (const f of controllerFiles) {
    const text = fs.readFileSync(f, "utf8");
    endpoints.push(...extractControllerInventory(text, path.relative(ROOT, f)));
  }

  const routesFile = path.join(ROOT, "frontend", "src", "routes", "AppRoutes.tsx");
  const routeText = fs.readFileSync(routesFile, "utf8");
  const feRoutes = extractFrontendRoutes(routeText);

  const menuSeedFile = path.join(ROOT, "sql", "menu_seed.sql");
  const menuSeedText = fs.readFileSync(menuSeedFile, "utf8");
  const menuRows = parseMenuSeed(menuSeedText);

  const locationSeedFile = path.join(ROOT, "sql", "location_seed.sql");
  const mastersSeedFile = path.join(ROOT, "sql", "masters_seed.sql");
  const seedRows = []
    .concat(extractInsertRows(fs.readFileSync(locationSeedFile, "utf8"), "sql/location_seed.sql"))
    .concat(extractInsertRows(fs.readFileSync(mastersSeedFile, "utf8"), "sql/masters_seed.sql"));

  const envFile = path.join(ROOT, "src", "config", "env.ts");
  const envText = fs.readFileSync(envFile, "utf8");
  const envVars = uniqBy(
    [...envText.matchAll(/required\('([A-Z0-9_]+)'\)/g)].map((m) => m[1]),
    (x) => x,
  );

  const workbook =
    `<?xml version="1.0"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:x="urn:schemas-microsoft-com:office:excel" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:html="http://www.w3.org/TR/REC-html40">` +
    sheetXml("README", [
      ["SIS EHRM - Master Inventory"],
      ["Generated At", new Date().toISOString()],
      ["Repo", path.basename(ROOT)],
      [""],
      ["Notes"],
      ["- Backend uses stored procedures only (CALL sp_*)"],
      ["- Swagger is auto-generated via tsoa (npm run generate)"],
      ["- Sidebar menus are dynamic from /auth/me (sp_menu_feed)"],
    ]) +
    sheetXml(
      "DB Tables",
      [["table_name", "source_file"]].concat(
        uniqBy(tables, (t) => `${t.table}|${t.file}`)
          .sort((a, b) => a.table.localeCompare(b.table))
          .map((t) => [t.table, t.file]),
      ),
    ) +
    sheetXml(
      "DB Procedures",
      [["procedure_name", "source_file"]].concat(
        uniqBy(procs, (p) => `${p.proc}|${p.file}`)
          .sort((a, b) => a.proc.localeCompare(b.proc))
          .map((p) => [p.proc, p.file]),
      ),
    ) +
    sheetXml(
      "API Endpoints",
      [["method", "path", "tag", "controller", "handler", "source_file"]].concat(
        endpoints
          .slice()
          .sort((a, b) => `${a.path}|${a.method}`.localeCompare(`${b.path}|${b.method}`))
          .map((e) => [e.method, e.path, e.tag, e.controller, e.fn, e.file]),
      ),
    ) +
    sheetXml(
      "Frontend Routes",
      [["path", "component", "source_file"]].concat(
        feRoutes
          .slice()
          .sort((a, b) => a.path.localeCompare(b.path))
          .map((r) => [r.path, r.component, "frontend/src/routes/AppRoutes.tsx"]),
      ),
    ) +
    sheetXml(
      "Menu Seed",
      [["menu_name", "menu_code", "parent_menu_id", "menu_path", "icon", "menu_order", "status"]].concat(
        menuRows.map((r) => [
          r.menu_name,
          r.menu_code,
          r.parent_menu_id_expr,
          r.menu_path,
          r.icon,
          r.menu_order,
          r.status,
        ]),
      ),
    ) +
    sheetXml(
      "Seed Data",
      [["table", "columns", "values", "source_file"]].concat(
        seedRows.map((r) => [r.table, r.columns, r.values, r.source_file]),
      ),
    ) +
    sheetXml(
      "Env Vars",
      [["name", "required"]]
        .concat(envVars.map((v) => [v, true]))
        .concat([
          ["DB_PORT", false],
          ["DB_PASSWORD", false],
          ["PORT", false],
          ["NODE_ENV", false],
          ["JWT_EXPIRES_IN", false],
          ["ALLOW_BOOTSTRAP", false],
        ]),
    ) +
    `</Workbook>`;

  const outDir = path.join(ROOT, "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "SIS_EHRM_Master.xls");
  fs.writeFileSync(outFile, workbook, "utf8");
  process.stdout.write(`Wrote ${path.relative(ROOT, outFile)}\n`);
}

main();
