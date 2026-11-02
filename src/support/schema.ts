/**
 * Minimal JSON schema checker for API responses. A rule returns one message
 * per violation, prefixed with the JSON path, so a failure names the exact
 * record and field (e.g. `[USD].displayName: is missing`).
 */
export type Rule = (value: unknown, path: string) => string[];

const kind = (value: unknown) => (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);
const fail = (path: string, message: string) => [`${path}: ${message}`];

export const string =
  (opts: { pattern?: RegExp; nonEmpty?: boolean } = {}): Rule =>
  (value, path) => {
    if (typeof value !== 'string') return fail(path, `expected string, got ${kind(value)}`);
    if (opts.nonEmpty && !value.trim()) return fail(path, 'is empty');
    if (opts.pattern && !opts.pattern.test(value)) return fail(path, `"${value}" does not match ${opts.pattern}`);
    return [];
  };

export const number =
  (opts: { integer?: boolean; min?: number } = {}): Rule =>
  (value, path) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fail(path, `expected finite number, got ${kind(value)}`);
    if (opts.integer && !Number.isInteger(value)) return fail(path, `expected integer, got ${value}`);
    if (opts.min !== undefined && value < opts.min) return fail(path, `${value} is below ${opts.min}`);
    return [];
  };

export const boolean = (): Rule => (value, path) => (typeof value === 'boolean' ? [] : fail(path, `expected boolean, got ${kind(value)}`));

export const url = (): Rule => (value, path) => {
  const errors = string({ nonEmpty: true })(value, path);
  if (errors.length) return errors;
  try {
    return /^https?:$/.test(new URL(value as string).protocol) ? [] : fail(path, `"${value}" is not an http(s) URL`);
  } catch {
    return fail(path, `"${value}" is not a valid URL`);
  }
};

export const array =
  (item: Rule, opts: { minItems?: number; key?: (item: unknown, index: number) => string } = {}): Rule =>
  (value, path) => {
    if (!Array.isArray(value)) return fail(path, `expected array, got ${kind(value)}`);
    if (opts.minItems !== undefined && value.length < opts.minItems) return fail(path, `expected at least ${opts.minItems} items, got ${value.length}`);
    return value.flatMap((entry, i) => item(entry, `${path}[${opts.key?.(entry, i) ?? i}]`));
  };

/** Object with required fields; `optional` fields are checked only when present. */
export const object =
  (required: Record<string, Rule>, optional: Record<string, Rule> = {}): Rule =>
  (value, path) => {
    if (kind(value) !== 'object') return fail(path, `expected object, got ${kind(value)}`);
    const record = value as Record<string, unknown>;
    return [
      ...Object.entries(required).flatMap(([field, rule]) =>
        field in record ? rule(record[field], `${path}.${field}`) : fail(`${path}.${field}`, 'is missing'),
      ),
      ...Object.entries(optional).flatMap(([field, rule]) => (field in record ? rule(record[field], `${path}.${field}`) : [])),
    ];
  };

/** A decimal string such as "1.000976", "-0.25" or "78,339.295000" (comma thousands grouping). */
export const decimalString = (): Rule => string({ pattern: /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/ });

/** Cross-field check: each `<field>Formatted` string matches the numeric `<field>`. */
export const formattedMatches =
  (fields: string[]): Rule =>
  (value, path) => {
    const record = value as Record<string, unknown>;
    return fields.flatMap((field) => {
      const raw = record[field];
      const text = record[`${field}Formatted`];
      if (typeof raw !== 'number' || typeof text !== 'string') return [];
      const decimals = text.split('.')[1]?.length ?? 0;
      const tolerance = 10 ** -decimals;
      return Math.abs(Number(text.replace(/,/g, '')) - raw) <= tolerance ? [] : fail(`${path}.${field}Formatted`, `"${text}" does not match ${field}=${raw}`);
    });
  };

export const allOf =
  (...rules: Rule[]): Rule =>
  (value, path) =>
    rules.flatMap((rule) => rule(value, path));

export const validate = (rule: Rule, value: unknown, root = '$') => rule(value, root);
