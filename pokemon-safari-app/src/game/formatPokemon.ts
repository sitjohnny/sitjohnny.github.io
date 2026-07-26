export function formatHeightM(heightDm: number): string {
  return `${(heightDm / 10).toFixed(1)} m`
}

export function formatWeightKg(weightHg: number): string {
  return `${(weightHg / 10).toFixed(1)} kg`
}
