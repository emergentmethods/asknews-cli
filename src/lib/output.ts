import chalk, { Chalk } from "chalk";
import Table from "cli-table3";
import terminalLink from "terminal-link";
import YAML from "yaml";
import schemasJson from "./table-schemas.json" with { type: "json" };
import type { OutputFormat } from "./types.js";

interface ColumnSpec {
  label: string;
  fields: string[];
  width?: number;
  max?: number | null;
  format?: string;
}
interface ShapeCondition {
  arrayKey?: string;
  some?: string[];
  every?: string[];
}
interface ShapeSpec {
  name: string;
  when: ShapeCondition[];
  columns: ColumnSpec[];
}
interface TableSchemas {
  arrayKeys: string[];
  defaults: { width: number; max: number };
  table: ShapeSpec[];
  detail: ShapeSpec[];
}
interface ResolvedColumn {
  label: string;
  width: number;
  max: number;
  preformatted: boolean;
}
interface Projection {
  columns: ResolvedColumn[];
  rows: Record<string, unknown>[];
}

const schemas = schemasJson as unknown as TableSchemas;

export interface OutputWriter {
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
  format: OutputFormat;
  color: boolean;
}

export function writeResult(writer: OutputWriter, value: unknown): void {
  const rendered = renderResult(value, writer.format, writer.color);
  writer.stdout.write(rendered.endsWith("\n") ? rendered : `${rendered}\n`);
}

export function writeDiagnostic(writer: OutputWriter, message: string): void {
  writer.stderr.write(message.endsWith("\n") ? message : `${message}\n`);
}

export function renderResult(value: unknown, format: OutputFormat, color = false): string {
  switch (format) {
    case "json":
      return JSON.stringify(value, null, 2);
    case "jsonl":
      return toJsonLines(value);
    case "yaml":
      return YAML.stringify(value).trimEnd();
    case "table":
      return renderTabular(value, color);
    case "human":
      return renderHuman(value, color);
  }
}

function toJsonLines(value: unknown): string {
  const records = Array.isArray(value) ? value : [value];
  return records.map((record) => JSON.stringify(record)).join("\n");
}

function renderHuman(value: unknown, color: boolean): string {
  const c = color ? chalk : new Chalk({ level: 0 });
  if (value === null || value === undefined) return c.dim("No data");
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return renderRows(value, color);

  const record = value as Record<string, unknown>;
  const preferredArray = schemas.arrayKeys.find((key) => Array.isArray(record[key]));
  if (preferredArray) {
    const metadata = Object.entries(record)
      .filter(
        ([key, item]) =>
          key !== preferredArray &&
          item !== null &&
          item !== undefined &&
          item !== "" &&
          !isOpaqueMetadata(key, item) &&
          (isScalar(item) || ["usage", "pagination"].includes(key)),
      )
      .map(([key, item]) => `${c.bold(humanize(key))}: ${summarize(item, 100)}`)
      .join("  ");
    const body = renderRows(record[preferredArray] as unknown[], color, preferredArray);
    return metadata ? `${metadata}\n\n${body}` : body;
  }
  const detail = matchShape(schemas.detail, undefined, [record]);
  if (detail) {
    return detail.columns
      .flatMap((column) => {
        const item = firstValue(record, column.fields);
        return item === undefined
          ? []
          : [`${c.bold(column.label)}: ${summarize(formatColumn(column, item))}`];
      })
      .join("\n");
  }
  return Object.entries(record)
    .map(([key, item]) => `${c.bold(humanize(key))}: ${summarize(item)}`)
    .join("\n");
}

function renderTabular(value: unknown, color: boolean): string {
  if (Array.isArray(value)) return renderRows(value, color);
  if (!value || typeof value !== "object") return renderHuman(value, color);
  const record = value as Record<string, unknown>;
  const arrayKey = schemas.arrayKeys.find((key) => Array.isArray(record[key]));
  return arrayKey
    ? renderRows(record[arrayKey] as unknown[], color, arrayKey)
    : renderHuman(value, color);
}

function renderRows(values: unknown[], color: boolean, kind?: string): string {
  if (values.length === 0) return color ? chalk.dim("No results") : "No results";
  if (!values.every(isRecord)) {
    return values.map((value, index) => `${index + 1}. ${summarize(value, 160)}`).join("\n");
  }
  return renderTable(projectRecords(values, kind), color);
}

function renderTable(projection: Projection, color: boolean): string {
  const columns = projection.columns.slice(0, 7);
  const table = new Table({
    head: columns.map((column) => column.label),
    wordWrap: true,
    colWidths: fitWidths(columns),
    style: {
      border: color ? ["grey"] : [],
      head: color ? ["cyan"] : [],
      compact: false,
    },
  });
  for (const row of projection.rows) {
    table.push(
      columns.map((column) =>
        column.preformatted
          ? String(row[column.label] ?? "")
          : summarize(row[column.label], column.max),
      ),
    );
  }
  return table.toString();
}

// Shrink column widths so the rendered table never exceeds the terminal width. An over-wide table
// wraps in the terminal, which looks like broken borders and blank lines between rows; fitting keeps
// it dense and intact. Only applies on a real TTY — when output is piped there is no fixed width to
// honor, so the configured widths are left untouched. Each column keeps a floor wide enough for its
// header (so labels are not truncated when there is room), and the remaining budget is shared in
// proportion to each column's slack, so greedy columns (e.g. URL) give back the most space.
function fitWidths(columns: ResolvedColumn[]): number[] {
  const minWidth = 8;
  const widths = columns.map((column) => column.width);
  const available = process.stdout.columns ?? 0;
  const budget = available - (columns.length + 1);
  if (available <= 0 || widths.reduce((sum, width) => sum + width, 0) <= budget) return widths;
  const floors = columns.map((column) =>
    column.preformatted
      ? Math.min(column.width, 22)
      : Math.min(column.width, Math.max(minWidth, column.label.length + 2)),
  );
  const floorSum = floors.reduce((sum, width) => sum + width, 0);
  if (floorSum >= budget) return scaleToBudget(floors, budget, minWidth);
  const slack = widths.map((width, index) => width - (floors[index] ?? minWidth));
  const slackSum = slack.reduce((sum, value) => sum + value, 0) || 1;
  const extra = budget - floorSum;
  return columns.map(
    (_column, index) =>
      (floors[index] ?? minWidth) + Math.floor(((slack[index] ?? 0) / slackSum) * extra),
  );
}

// Last-resort proportional scale when even header-sized floors do not fit the terminal.
function scaleToBudget(widths: number[], budget: number, minWidth: number): number[] {
  const total = widths.reduce((sum, width) => sum + width, 0) || 1;
  return widths.map((width) => Math.max(minWidth, Math.floor((width / total) * budget)));
}

function projectRecords(records: Record<string, unknown>[], kind?: string): Projection {
  const shape = matchShape(schemas.table, kind, records);
  if (shape) {
    const visible = shape.columns.filter((column) =>
      records.some((record) => firstValue(record, column.fields) !== undefined),
    );
    return {
      columns: visible.map(resolveColumn),
      rows: records.map((record) =>
        Object.fromEntries(
          visible.map((column) => [
            column.label,
            formatColumn(column, firstValue(record, column.fields)),
          ]),
        ),
      ),
    };
  }
  return fallbackProjection(records);
}

function resolveColumn(column: ColumnSpec): ResolvedColumn {
  return {
    label: column.label,
    width: column.width ?? schemas.defaults.width,
    max: column.max === null ? Number.POSITIVE_INFINITY : (column.max ?? schemas.defaults.max),
    preformatted: column.format === "url",
  };
}

// Generic projection for response shapes not described in table-schemas.json: surface the most
// useful scalar fields by name and keep the table readable.
function fallbackProjection(records: Record<string, unknown>[]): Projection {
  const priority = [
    "title",
    "headline",
    "name",
    "subject",
    "query",
    "summary",
    "description",
    "content",
    "reasoning",
    "report",
    "status",
    "model",
    "type",
    "source_id",
    "source",
    "classification",
    "categories",
    "country",
    "published_at",
    "pub_date",
    "date",
    "created_at",
    "updated_at",
    "active",
    "count",
    "hit_count",
    "uuid",
    "id",
    "article_id",
    "story_id",
    "url",
  ];
  const keys = [
    ...priority.filter((key) => records.some((record) => record[key] !== undefined)),
    ...records.flatMap(Object.keys),
  ]
    .filter((key, index, all) => all.indexOf(key) === index)
    .slice(0, 7);
  return {
    columns: keys.map((key) => {
      const label = humanize(key);
      return {
        label,
        width: fallbackWidth(label),
        max: label === "Summary" ? Number.POSITIVE_INFINITY : schemas.defaults.max,
        preformatted: false,
      };
    }),
    rows: records.map((record) =>
      Object.fromEntries(keys.map((key) => [humanize(key), record[key] ?? ""])),
    ),
  };
}

function matchShape(
  shapes: ShapeSpec[],
  kind: string | undefined,
  records: Record<string, unknown>[],
): ShapeSpec | undefined {
  return shapes.find((shape) =>
    shape.when.some((condition) => conditionMatches(condition, kind, records)),
  );
}

function conditionMatches(
  condition: ShapeCondition,
  kind: string | undefined,
  records: Record<string, unknown>[],
): boolean {
  if (condition.arrayKey !== undefined) return kind === condition.arrayKey;
  if (condition.some) {
    return records.some((record) => condition.some?.every((field) => field in record));
  }
  if (condition.every) {
    return (
      records.length > 0 &&
      records.every((record) => condition.every?.every((field) => field in record))
    );
  }
  return false;
}

function firstValue(record: Record<string, unknown>, paths: string[]): unknown {
  for (const path of paths) {
    let value: unknown = record;
    for (const segment of path.split(".")) {
      if (Array.isArray(value)) {
        value = value[Number(segment)];
      } else if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[segment];
      } else {
        value = undefined;
        break;
      }
    }
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isScalar(value: unknown): boolean {
  return value === null || ["boolean", "number", "string", "undefined"].includes(typeof value);
}

function isOpaqueMetadata(key: string, value: unknown): boolean {
  return (
    ["offset", "next_page", "previous_page"].includes(key) &&
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value)
  );
}

function summarize(value: unknown, maxLength = 240): string {
  const rendered = Array.isArray(value)
    ? value.map((item) => summarize(item, 40)).join(", ")
    : isScalar(value)
      ? String(value ?? "")
      : compactObject(value);
  const normalized = rendered.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function compactObject(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return String(value ?? "");
  return Object.entries(value as Record<string, unknown>)
    .slice(0, 4)
    .map(([key, item]) => `${key}: ${summarize(item, 30)}`)
    .join(", ");
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function fallbackWidth(column: string): number {
  if (column === "Title") return 36;
  if (column === "Summary") return 58;
  if (column === "Name") return 24;
  if (column === "Email") return 32;
  if (column === "Domain") return 30;
  if (column === "Source") return 18;
  if (column === "Date") return 18;
  if (column === "Category") return 20;
  return schemas.defaults.width;
}

function formatColumn(column: ColumnSpec, value: unknown): unknown {
  if (value === undefined || value === null) return "";
  if (column.format === "date") return formatDate(value);
  if (column.format === "url") return formatLink(value);
  return value;
}

// Render a URL as a compact cell showing the bare domain. On terminals that support hyperlinks
// (OSC 8) the domain is clickable and opens the full URL; elsewhere it stays plain text. Either way
// the cell is narrow and never breaks a long link mid-string — the full URL remains available in
// JSON/YAML output. Non-URL values are passed through unchanged.
function formatLink(value: unknown): string {
  const url = String(value);
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
  return terminalLink(host, url, { fallback: () => host });
}

function formatDate(value: unknown): string {
  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : typeof value === "string"
        ? new Date(value)
        : null;
  if (!date || Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace("T", " ").slice(0, 16);
}

export function writeStreamEvent(writer: OutputWriter, event: unknown): boolean {
  if (writer.format === "jsonl") {
    writer.stdout.write(`${JSON.stringify(event)}\n`);
    return true;
  }
  if (writer.format !== "human") {
    writer.stdout.write(`${renderResult(event, writer.format, writer.color)}\n`);
    return true;
  }
  const text = streamText(event);
  if (!text) return false;
  writer.stdout.write(text);
  return true;
}

export function streamText(event: unknown): string {
  if (typeof event === "string") return event;
  if (!event || typeof event !== "object") return "";
  const record = event as Record<string, unknown>;
  for (const candidate of [
    record.text,
    record.content,
    nested(record, ["delta", "text"]),
    nested(record, ["delta", "content"]),
    nested(record, ["choices", "0", "delta", "content"]),
    nested(record, ["content_block", "text"]),
  ]) {
    if (typeof candidate === "string") return candidate;
  }
  return "";
}

function nested(value: unknown, path: string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[Number(segment)];
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}
