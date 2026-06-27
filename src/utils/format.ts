export function formatBytesParts(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: "0", unit: "B" };
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  return {
    value: value.toFixed(value >= 100 || i === 0 ? 0 : 1),
    unit: units[i],
  };
}

export function formatBytes(bytes: number): string {
  const { value, unit } = formatBytesParts(bytes);
  return `${value} ${unit}`;
}

export function formatBytesCompactParts(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: "0", unit: "b" };
  const units = ["b", "kb", "mb", "gb", "tb"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  return {
    value: value.toFixed(value >= 100 || i === 0 ? 0 : 1),
    unit: units[i],
  };
}

export function formatBytesCompact(bytes: number): string {
  const { value, unit } = formatBytesCompactParts(bytes);
  return `${value}${unit}`;
}

export function formatCount(count: number): string {
  return count.toLocaleString();
}
