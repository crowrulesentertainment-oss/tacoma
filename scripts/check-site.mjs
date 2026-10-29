#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const ignored = new Set([".git", "node_modules", ".github"]);
const htmlFiles = [];
const jsFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) {
      if (entry.name.endsWith(".html")) htmlFiles.push(full);
      if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) jsFiles.push(full);
    }
  }
}
walk(root);

let failures = 0;
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failures++;
    console.error("\n[JS SYNTAX] " + path.relative(root, file));
    console.error((result.stderr || result.stdout).trim());
  }
}

const attrPattern = /\b(?:href|src|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const idPattern = /\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  const ids = new Set();
  let match;
  while ((match = idPattern.exec(source))) {
    const id = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (id) ids.add(id);
  }
  attrPattern.lastIndex = 0;
  while ((match = attrPattern.exec(source))) {
    let raw = (match[1] ?? match[2] ?? match[3] ?? "").trim().replaceAll("&amp;", "&");
    if (!raw || /^(?:#|\/\/|[a-z][a-z0-9+.-]*:)/i.test(raw)) continue;
    let decoded;
    try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
    const hashAt = decoded.indexOf("#");
    const target = hashAt >= 0 ? decoded.slice(0, hashAt) : decoded;
    const fragment = hashAt >= 0 ? decoded.slice(hashAt + 1) : "";
    if (!target) {
      if (fragment && !ids.has(fragment)) {
        failures++;
        console.error("[BROKEN ANCHOR] " + path.relative(root, file) + " -> #" + fragment);
      }
      continue;
    }
    const cleanTarget = target.split("?")[0];
    let resolved = path.resolve(path.dirname(file), cleanTarget);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, "index.html");
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      failures++;
      console.error("[BROKEN LINK] " + path.relative(root, file) + " -> " + raw);
      continue;
    }
    if (fragment && /\.html?$/i.test(resolved)) {
      const targetSource = fs.readFileSync(resolved, "utf8");
      const targetIds = new Set();
      let idMatch;
      while ((idMatch = idPattern.exec(targetSource))) {
        const id = (idMatch[1] ?? idMatch[2] ?? idMatch[3] ?? "").trim();
        if (id) targetIds.add(id);
      }
      idPattern.lastIndex = 0;
      if (!targetIds.has(fragment)) {
        failures++;
        console.error("[BROKEN ANCHOR] " + path.relative(root, file) + " -> " + raw);
      }
    }
  }
}

console.log("Checked " + jsFiles.length + " JavaScript files and " + htmlFiles.length + " HTML pages.");
if (failures) {
  console.error("Site checks found " + failures + " issue(s).");
  process.exit(1);
}
console.log("All JavaScript syntax and local HTML links passed.");
