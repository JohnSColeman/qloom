/**
 * Parse Java `.properties` text into a flat `key → value` map. Supports the
 * format Qloom message catalogues need: `#`/`!` comment lines, `=` / `:` / space
 * separators, backslash line-continuations, and `\uXXXX` / `\n` / `\t` / `\r` /
 * `\f` / escaped-separator escapes. Blank lines and leading whitespace are
 * ignored. (No `.properties` output side — Qloom only reads them.)
 */
export function parseProperties(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.split(/\r\n|\r|\n/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!.replace(/^[ \t\f]+/, "");
    if (line === "" || line.startsWith("#") || line.startsWith("!")) continue;
    // A line ending in an odd number of backslashes continues onto the next.
    while (endsWithOddBackslashes(line) && i + 1 < lines.length) {
      line = line.slice(0, -1) + lines[++i]!.replace(/^[ \t\f]+/, "");
    }
    const { key, value } = splitKeyValue(line);
    if (key) out[unescape(key)] = unescape(value);
  }
  return out;
}

/** The key runs to the first unescaped separator (`=`, `:`, or whitespace); the
 *  value is the rest, after one separator and surrounding whitespace. */
function splitKeyValue(line: string): { key: string; value: string } {
  let i = 0;
  let key = "";
  while (i < line.length) {
    const c = line[i]!;
    if (c === "\\") {
      key += c + (line[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (c === "=" || c === ":" || c === " " || c === "\t" || c === "\f") break;
    key += c;
    i++;
  }
  while (i < line.length && isSep(line[i]!)) i++;
  if (i < line.length && (line[i] === "=" || line[i] === ":")) {
    i++;
    while (i < line.length && isSep(line[i]!)) i++;
  }
  return { key, value: line.slice(i) };
}

function isSep(c: string): boolean {
  return c === " " || c === "\t" || c === "\f";
}

function endsWithOddBackslashes(s: string): boolean {
  let n = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === "\\"; i--) n++;
  return n % 2 === 1;
}

function unescape(s: string): string {
  return s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, esc: string) => {
    if (esc[0] === "u") return String.fromCharCode(parseInt(esc.slice(1), 16));
    switch (esc) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case "f":
        return "\f";
      default:
        return esc; // \\, \=, \:, \  → the literal char
    }
  });
}
