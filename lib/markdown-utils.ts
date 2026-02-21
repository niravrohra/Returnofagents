/**
 * Markdown normalization utilities (from chat/page.tsx).
 * Handles tables, headings, lists, code blocks.
 */

function processTable(lines: string[]): string[] {
  if (lines.length === 0) return [];

  const result: string[] = [];
  let hasSeparator = false;

  const cleanedLines = lines.filter((line) => {
    const content = line.replace(/\|/g, "").trim();
    return !/^[-─═]{3,}$/.test(content);
  });

  if (cleanedLines.length === 0) return [];

  const firstRow = cleanedLines[0];
  const colCount = firstRow.split("|").filter((c) => c.trim()).length;

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i];

    if (/^\|?\s*:?[-]+:?\s*\|/.test(line)) {
      hasSeparator = true;
      result.push(line);
      continue;
    }

    if (!line.startsWith("|")) line = "|" + line;
    if (!line.endsWith("|")) line = line + "|";

    result.push(line);

    if (i === 0 && !hasSeparator) {
      const separator = "|" + Array(colCount).fill("---").join("|") + "|";
      result.push(separator);
      hasSeparator = true;
    }
  }

  return ["", ...result, ""];
}

export function normalizeMarkdown(text: string): string {
  if (!text) return "";

  let s = text.replace(/\r\n?/g, "\n");

  const codeBlocks: string[] = [];
  s = s.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  s = s.replace(/([^\n])(#{1,6}\s)/g, "$1\n\n$2");
  s = s.replace(/([^\n])(\n)([-*]\s|\d+\.\s)/g, "$1\n\n$3");

  s = s
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !/^[-─═]{3,}$/.test(trimmed);
    })
    .join("\n");

  const lines = s.split("\n");
  const processedLines: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes("|") && line.length > 2) {
      inTable = true;
      const cleanLine = line.replace(/^[-*+]\s*/, "");
      const noTicks = cleanLine.replace(/`([^`]+)`/g, "$1");
      tableLines.push(noTicks);

      const nextIsTable = i < lines.length - 1 && lines[i + 1].includes("|");
      if (!nextIsTable) {
        if (tableLines.length > 0) {
          const processed = processTable(tableLines);
          processedLines.push(...processed);
          tableLines = [];
          inTable = false;
        }
      }
    } else {
      if (inTable && tableLines.length > 0) {
        const processed = processTable(tableLines);
        processedLines.push(...processed);
        tableLines = [];
        inTable = false;
      }
      if (line) {
        processedLines.push(line);
      }
    }
  }

  if (tableLines.length > 0) {
    const processed = processTable(tableLines);
    processedLines.push(...processed);
  }

  s = processedLines.join("\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  codeBlocks.forEach((block, i) => {
    s = s.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return s.trim();
}
