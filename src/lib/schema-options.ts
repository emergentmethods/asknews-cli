import { type Command, Option } from "commander";
import { UsageError } from "./errors.js";
import type { OperationDefinition, OperationParameter } from "./types.js";

export interface JsonSchema {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  example?: unknown;
  minimum?: number;
  maximum?: number;
  format?: string;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
}

export interface RegisteredOption {
  apiName: string;
  attributeName: string;
  schema: JsonSchema;
}

export function registerParameterOptions(
  command: Command,
  operation: OperationDefinition,
  excluded = new Set<string>(),
): RegisteredOption[] {
  return operation.parameters
    .filter((parameter) => !excluded.has(parameter.name))
    .map((parameter) => {
      const schema = parameterSchema(parameter);
      return registerSchemaOption(command, parameter.name, schema, {
        required: parameter.required,
        location: parameter.location,
      });
    });
}

export interface CuratedOverride {
  /** Replacement help text for the option (e.g. mirrored from the MCP tool). */
  description: string;
  /** Allowed values when the schema lacks them or uses a different set. */
  choices?: string[];
  /** Displayed default when it differs from the schema default. */
  default?: unknown;
  /** Schema type override, e.g. widen a collapsed string parameter to an array. */
  type?: string;
  itemType?: string;
}

export function registerCuratedParameterOptions(
  command: Command,
  operation: OperationDefinition,
  include: Record<string, CuratedOverride>,
): RegisteredOption[] {
  const parameters = new Map(operation.parameters.map((parameter) => [parameter.name, parameter]));
  return Object.entries(include).map(([name, override]) => {
    const parameter = parameters.get(name);
    if (!parameter) {
      throw new Error(`Operation ${operation.operationId} has no parameter "${name}"`);
    }
    const schema: JsonSchema = {
      ...parameterSchema(parameter),
      description: override.description,
      ...(override.choices ? { enum: override.choices } : {}),
      ...(override.default !== undefined ? { default: override.default } : {}),
      ...(override.type ? { type: override.type } : {}),
      ...(override.itemType ? { items: { type: override.itemType } } : {}),
    };
    return registerSchemaOption(command, name, schema, {
      required: parameter.required,
      location: parameter.location,
    });
  });
}

export function registerBodyOptions(
  command: Command,
  operation: OperationDefinition,
  excluded = new Set<string>(),
): RegisteredOption[] {
  const schema = operation.requestBody?.schema as JsonSchema | null;
  if (!schema?.properties) return [];
  return Object.entries(schema.properties)
    .filter(([name]) => !excluded.has(name))
    .map(([name, property]) =>
      registerSchemaOption(command, name, property, {
        required: schema.required?.includes(name) ?? false,
        location: "body",
      }),
    );
}

export function readRegisteredOptions(
  command: Command,
  options: RegisteredOption[],
): Record<string, unknown> {
  return Object.fromEntries(
    options.flatMap((option) => {
      const raw = command.getOptionValue(option.attributeName);
      return raw === undefined ? [] : [[option.apiName, parseSchemaValue(raw, option.schema)]];
    }),
  );
}

export function formatBodyFields(operation: OperationDefinition): string {
  const schema = operation.requestBody?.schema as JsonSchema | null;
  if (!schema?.properties) return "  None.";
  return Object.entries(schema.properties)
    .map(([name, property]) => {
      const details = schemaDetails(property, schema.required?.includes(name) ?? false);
      const description = property.description
        ? `\n      ${wrap(property.description, 72, 6)}`
        : "";
      return `  --${optionName(name)} <value>\n      ${details}${description}`;
    })
    .join("\n");
}

export function schemaDetails(schema: JsonSchema, required: boolean, location?: string): string {
  return [
    location,
    schemaType(schema),
    required ? "required" : "optional",
    schema.format ? `format: ${schema.format}` : undefined,
    schema.minimum !== undefined ? `min: ${schema.minimum}` : undefined,
    schema.maximum !== undefined ? `max: ${schema.maximum}` : undefined,
    schema.default !== undefined ? `default: ${JSON.stringify(schema.default)}` : undefined,
    enumValues(schema).length > 0 ? `allowed: ${enumValues(schema).join("|")}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");
}

export function enumValues(schema: JsonSchema): string[] {
  if (schema.enum) return schema.enum.map(String);
  const variants = schema.oneOf ?? schema.anyOf ?? [];
  return variants.flatMap((variant) => variant.enum?.map(String) ?? []);
}

export function schemaType(schema: JsonSchema): string {
  if (schema.type === "array") return `array<${schemaType(schema.items ?? {})}>`;
  if (schema.type) return schema.type;
  const variants = schema.oneOf ?? schema.anyOf ?? [];
  const types = [...new Set(variants.map((variant) => variant.type).filter(Boolean))];
  return types.length > 0 ? types.join("|") : "object";
}

export function optionName(name: string): string {
  return name.replaceAll("_", "-");
}

function registerSchemaOption(
  command: Command,
  apiName: string,
  schema: JsonSchema,
  context: { required: boolean; location: string },
): RegisteredOption {
  const name = optionName(apiName);
  const boolean = schemaType(schema).split("|").includes("boolean");
  const array = acceptsArray(schema);
  const option = new Option(
    `--${name} ${boolean ? "[boolean]" : "<value>"}`,
    schema.description ?? `${context.location} ${schemaType(schema)} value`,
  );
  if (array) {
    option.argParser(collect);
  }
  const allowed = enumValues(schema);
  const choices = allowed.length > 0 && !array && !boolean;
  if (choices) option.choices(allowed);
  option.helpGroup("API options:");
  const details = choices
    ? schemaDetails(schema, context.required, context.location).replace(/, allowed: [^,]+$/, "")
    : schemaDetails(schema, context.required, context.location);
  if (schema.default !== undefined) {
    option.defaultValueDescription = JSON.stringify(schema.default);
  }
  option.description = `${option.description} [${details}]`;
  command.addOption(option);
  return { apiName, attributeName: option.attributeName(), schema };
}

function parameterSchema(parameter: OperationParameter): JsonSchema {
  return {
    type: parameter.type,
    ...(parameter.itemType ? { items: { type: parameter.itemType } } : {}),
    ...(parameter.description ? { description: parameter.description } : {}),
    ...(parameter.defaultValue !== undefined ? { default: parameter.defaultValue } : {}),
    ...(parameter.allowedValues ? { enum: parameter.allowedValues } : {}),
    ...(parameter.format ? { format: parameter.format } : {}),
    ...(parameter.minimum !== undefined ? { minimum: parameter.minimum } : {}),
    ...(parameter.maximum !== undefined ? { maximum: parameter.maximum } : {}),
  };
}

function collect(value: string, previous: string[] | undefined): string[] {
  return [...(previous ?? []), value];
}

function parseSchemaValue(raw: unknown, schema: JsonSchema): unknown {
  if (acceptsArray(schema)) {
    const values = Array.isArray(raw) ? raw : [raw];
    const parsed = values.flatMap((value) => {
      if (typeof value !== "string") return [value];
      const item = parseJson(value);
      if (Array.isArray(item)) return item;
      return value.includes(",") ? value.split(",").map((part) => part.trim()) : [item];
    });
    if (values.length === 1 && parsed.length === 1 && acceptsNonArray(schema)) return parsed[0];
    return parsed;
  }
  if (typeof raw !== "string") return raw;
  if (schema.type === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new UsageError(`--${optionName(schema.title ?? "value")} expects true or false`);
  }
  if (schema.type === "integer" || schema.type === "number") {
    const number = Number(raw);
    if (!Number.isFinite(number) || (schema.type === "integer" && !Number.isInteger(number))) {
      throw new UsageError(`Expected ${schema.type}, received "${raw}"`);
    }
    if (schema.minimum !== undefined && number < schema.minimum) {
      throw new UsageError(`Value must be at least ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && number > schema.maximum) {
      throw new UsageError(`Value must be at most ${schema.maximum}`);
    }
    return number;
  }
  const types = new Set((schema.oneOf ?? schema.anyOf ?? []).map((variant) => variant.type));
  if (types.has("boolean") && (raw === "true" || raw === "false")) return raw === "true";
  if (types.has("integer") || types.has("number")) {
    const number = Number(raw);
    if (Number.isFinite(number)) return number;
  }
  if (schema.type === "object" || types.has("object") || raw.startsWith("{")) {
    const parsed = parseJson(raw);
    if (parsed === raw) throw new UsageError("Object options must be valid JSON");
    return parsed;
  }
  if (types.has("array") || raw.startsWith("[")) return parseJson(raw);
  return raw;
}

function acceptsArray(schema: JsonSchema): boolean {
  return (
    schema.type === "array" ||
    (schema.oneOf ?? schema.anyOf ?? []).some((variant) => variant.type === "array")
  );
}

function acceptsNonArray(schema: JsonSchema): boolean {
  if (schema.type && schema.type !== "array" && schema.type !== "null") return true;
  return (schema.oneOf ?? schema.anyOf ?? []).some(
    (variant) => variant.type !== "array" && variant.type !== "null",
  );
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function wrap(value: string, width: number, indent: number): string {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join(`\n${" ".repeat(indent)}`);
}
