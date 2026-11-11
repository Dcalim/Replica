#!/usr/bin/env node
// Usage: node scripts/test-report.js [--flaky N]
// Runs logic, isp and combined suites for BackEnd and FrontEnd with coverage,
// then writes reports/test-report.md (+ reports/test-report.json).
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "reports");
const flakyRuns = Number(process.argv[process.argv.indexOf("--flaky") + 1]) || 0;

const pkgs = {
  BackEnd: ["--collectCoverageFrom=src/**/*.js"],
  FrontEnd: ["--collectCoverageFrom=src/utils/**/*.ts", "--collectCoverageFrom=src/reducers/ui.ts"],
};
const suites = { logic: ["tests/logic"], isp: ["tests/isp"], combined: [] };

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function jest(pkg, args, tag) {
  const jsonFile = path.join(out, `${tag}.json`);
  spawnSync("npx", ["jest", "--silent", "--json", `--outputFile=${jsonFile}`, ...args], {
    cwd: path.join(root, pkg), stdio: "ignore",
  });
  return JSON.parse(fs.readFileSync(jsonFile, "utf8"));
}

const pct = (m) => (m ? `${m.pct}%` : "-");
const results = {};

for (const [pkg, collect] of Object.entries(pkgs)) {
  results[pkg] = {};
  for (const [name, filter] of Object.entries(suites)) {
    const covDir = path.join(out, `coverage-${pkg}-${name}`);
    const r = jest(pkg, [...filter, "--coverage", ...collect, "--coverageReporters=json-summary",
      "--coverageReporters=html", `--coverageDirectory=${covDir}`], `${pkg}-${name}`);
    const cov = JSON.parse(fs.readFileSync(path.join(covDir, "coverage-summary.json"), "utf8"));
    const tests = r.testResults.flatMap((s) => s.assertionResults);
    const times = r.testResults.map((s) => s.endTime - s.startTime);
    results[pkg][name] = {
      total: r.numTotalTests, passed: r.numPassedTests, failed: r.numFailedTests,
      seconds: ((Math.max(...times, 0)) / 1000).toFixed(2),
      cov: cov.total,
      files: Object.entries(cov).filter(([k]) => k !== "total"),
      failures: tests.filter((t) => t.status === "failed").map((t) => t.fullName),
    };
  }
}

let md = `# Replica test report\n\nGenerated ${new Date().toISOString()} · Node ${process.version}\n\n`;
for (const [pkg, byName] of Object.entries(results)) {
  md += `## ${pkg}\n\n| Metric | Logic | ISP | Combined |\n|---|---|---|---|\n`;
  const row = (label, f) => (md += `| ${label} | ${["logic", "isp", "combined"].map((n) => f(byName[n])).join(" | ")} |\n`);
  row("Test cases", (s) => s.total);
  row("Passing", (s) => s.passed);
  row("Failing", (s) => s.failed);
  row("Statements", (s) => pct(s.cov.statements));
  row("Branches", (s) => pct(s.cov.branches));
  row("Functions", (s) => pct(s.cov.functions));
  row("Lines", (s) => pct(s.cov.lines));
  row("Run time (s)", (s) => s.seconds);

  md += `\n### Per-file coverage (combined)\n\n| File | Stmts | Branch | Funcs | Lines |\n|---|---|---|---|---|\n`;
  for (const [file, c] of byName.combined.files)
    md += `| ${path.relative(path.join(root, pkg), file)} | ${pct(c.statements)} | ${pct(c.branches)} | ${pct(c.functions)} | ${pct(c.lines)} |\n`;

  md += `\n### Failing tests (defect candidates)\n\n`;
  for (const n of ["logic", "isp"]) {
    for (const f of byName[n].failures) md += `- [${n}] ${f}\n`;
  }
  if (!byName.logic.failures.length && !byName.isp.failures.length) md += "None\n";
  md += "\n";
}

if (flakyRuns) {
  md += `## Flakiness (${flakyRuns} runs per package)\n\n`;
  for (const pkg of Object.keys(pkgs)) {
    const seen = {};
    for (let i = 0; i < flakyRuns; i++) {
      const r = jest(pkg, [], `flaky-${pkg}-${i}`);
      for (const t of r.testResults.flatMap((s) => s.assertionResults)) (seen[t.fullName] ??= new Set()).add(t.status);
      fs.rmSync(path.join(out, `flaky-${pkg}-${i}.json`));
    }
    const flaky = Object.entries(seen).filter(([, s]) => s.size > 1).map(([n]) => n);
    md += `**${pkg}:** ${flaky.length} flaky of ${Object.keys(seen).length} tests\n${flaky.map((n) => `- ${n}\n`).join("")}\n`;
  }
}

fs.writeFileSync(path.join(out, "test-report.md"), md);
fs.writeFileSync(path.join(out, "test-report.json"), JSON.stringify(results, null, 2));
console.log(md);
console.log(`Written to ${path.join(out, "test-report.md")} (HTML coverage in reports/coverage-*/index.html)`);
