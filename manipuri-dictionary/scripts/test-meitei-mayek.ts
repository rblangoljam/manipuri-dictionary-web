import { convertToUnicode } from "../src/lib/meitei-mayek";

// Test cases from spec section 53:
// napi → ꯅꯥꯄꯤ
// hOb  → ꯍꯧꯕ
// lM   → ꯂꯝ
// lMpaQ → ꯂꯝꯄꯥꯛ
// napi hOb / lMpaQ! → ꯅꯥꯄꯤ ꯍꯧꯕ / ꯂꯝꯄꯥꯛ!
const tests: Array<{ input: string; expected: string; label: string }> = [
  { input: "napi", expected: "\uABC5\uABE5\uABC4\uABE4", label: "napi" },
  { input: "hOb", expected: "\uABCD\uABE7\uABD5", label: "hOb" },
  { input: "lM", expected: "\uABC2\uABDD", label: "lM" },
  { input: "lMpaQ", expected: "\uABC2\uABDD\uABC4\uABE5\uABDB", label: "lMpaQ" },
  { input: "napi hOb / lMpaQ!", expected: "\uABC5\uABE5\uABC4\uABE4 \uABCD\uABE7\uABD5 / \uABC2\uABDD\uABC4\uABE5\uABDB!", label: "mixed" },
];

let failed = 0;
for (const t of tests) {
  const result = convertToUnicode(t.input);
  const pass = result === t.expected;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"} ${t.label}: "${t.input}" -> "${result}"${pass ? "" : ` (expected "${t.expected}")`}`);
}

console.log(`\n${tests.length - failed}/${tests.length} tests passed`);
process.exit(failed > 0 ? 1 : 0);