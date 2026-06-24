// Generalizes RunMapScreen's polar spiral (r = R0 + i·DR, θ = i·DTHETA) to
// layouts with multiple parallel items per step — branch lanes are spread
// along the tangent of the spiral at that step instead of all sharing one
// point.

export interface SpiralOpts {
  cx: number
  cy: number
  r0: number
  dr: number
  dtheta: number
  laneGap: number
}

export interface SpiralPos { x: number; y: number }

export function spiralLayout(layers: string[][], opts: SpiralOpts): Map<string, SpiralPos> {
  const { cx, cy, r0, dr, dtheta, laneGap } = opts
  const positions = new Map<string, SpiralPos>()

  layers.forEach((ids, layerIndex) => {
    const r = r0 + layerIndex * dr
    const theta = layerIndex * dtheta
    const centerX = cx + r * Math.cos(theta)
    const centerY = cy + r * Math.sin(theta)
    const tangentX = -Math.sin(theta)
    const tangentY = Math.cos(theta)

    const n = ids.length
    ids.forEach((id, i) => {
      const offset = (i - (n - 1) / 2) * laneGap
      positions.set(id, {
        x: centerX + tangentX * offset,
        y: centerY + tangentY * offset,
      })
    })
  })

  return positions
}
