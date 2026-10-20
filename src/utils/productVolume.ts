export function parseProductVolume(value: string) {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { amount: undefined, unit: value };
  return { amount: Number(match[1]), unit: match[2].trim() };
}

export function formatProductVolume(value: string) {
  const volume = parseProductVolume(value);
  if (volume.amount === undefined || !volume.unit) return value || '—';
  return `${volume.amount} ${volume.unit}`;
}
