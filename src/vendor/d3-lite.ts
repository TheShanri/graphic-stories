export interface LinearScale {
  (value: number): number
  domain(): [number, number]
  domain(values: [number, number]): LinearScale
  range(): [number, number]
  range(values: [number, number]): LinearScale
  nice(count?: number): LinearScale
}

export interface BandScale<T extends string | number = string> {
  (value: T): number
  domain(values: T[]): BandScale<T>
  range(values: [number, number]): BandScale<T>
  padding(value: number): BandScale<T>
  paddingInner(value: number): BandScale<T>
  paddingOuter(value: number): BandScale<T>
  bandwidth(): number
  step(): number
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function scaleLinear(): LinearScale {
  let domain: [number, number] = [0, 1]
  let range: [number, number] = [0, 1]

  const scale = ((value: number) => {
    const [d0, d1] = domain
    const [r0, r1] = range
    if (d1 - d0 === 0) {
      return r0
    }
    const t = (value - d0) / (d1 - d0)
    return r0 + t * (r1 - r0)
  }) as LinearScale

  scale.domain = ((values?: [number, number]) => {
    if (!values) {
      return [...domain] as [number, number]
    }
    domain = [...values]
    return scale
  }) as LinearScale['domain']

  scale.range = ((values?: [number, number]) => {
    if (!values) {
      return [...range] as [number, number]
    }
    range = [...values]
    return scale
  }) as LinearScale['range']

  scale.nice = (count = 10) => {
    const [d0, d1] = domain
    if (d1 === d0) {
      return scale
    }
    const step = niceStep(d0, d1, count)
    const niceStart = Math.floor(d0 / step) * step
    const niceStop = Math.ceil(d1 / step) * step
    domain = [niceStart, niceStop]
    return scale
  }

  return scale
}

export function scaleBand<T extends string | number = string>(): BandScale<T> {
  let domain: T[] = []
  let range: [number, number] = [0, 1]
  let paddingInnerValue = 0
  let paddingOuterValue = 0
  let stepValue = 0
  let bandwidthValue = 0

  const rescale = () => {
    const n = domain.length
    const distance = Math.abs(range[1] - range[0])
    if (n === 0) {
      stepValue = 0
      bandwidthValue = 0
      return
    }
    const totalPadding = paddingInnerValue * Math.max(0, n - 1) + paddingOuterValue * 2
    stepValue = distance / Math.max(1, n + totalPadding)
    bandwidthValue = stepValue * (1 - paddingInnerValue)
  }

  const scale = ((value: T) => {
    const index = domain.indexOf(value)
    if (index === -1) {
      return NaN
    }
    const dir = range[1] < range[0] ? -1 : 1
    const start = dir === 1 ? range[0] : range[1]
    const offset = paddingOuterValue * stepValue
    return start + dir * (offset + stepValue * index)
  }) as BandScale<T>

  scale.domain = (values: T[]) => {
    domain = [...values]
    rescale()
    return scale
  }

  scale.range = (values: [number, number]) => {
    range = [...values]
    rescale()
    return scale
  }

  scale.padding = (value: number) => {
    paddingInnerValue = clamp01(value)
    paddingOuterValue = clamp01(value)
    rescale()
    return scale
  }

  scale.paddingInner = (value: number) => {
    paddingInnerValue = clamp01(value)
    rescale()
    return scale
  }

  scale.paddingOuter = (value: number) => {
    paddingOuterValue = clamp01(value)
    rescale()
    return scale
  }

  scale.bandwidth = () => bandwidthValue
  scale.step = () => stepValue

  rescale()
  return scale
}

const niceStep = (start: number, stop: number, count: number) => {
  const rawStep = (stop - start) / Math.max(1, count)
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))))
  const error = rawStep / magnitude
  if (error >= 7.5) {
    return 10 * magnitude
  }
  if (error >= 3.5) {
    return 5 * magnitude
  }
  if (error >= 1.5) {
    return 2 * magnitude
  }
  return magnitude
}

export function max<T>(values: T[], accessor: (item: T) => number): number {
  let best = -Infinity
  for (const item of values) {
    const candidate = accessor(item)
    if (candidate > best) {
      best = candidate
    }
  }
  return best
}

export function ticks(start: number, stop: number, count: number): number[] {
  if (count <= 0 || start === stop) {
    return [start]
  }
  const step = (stop - start) / count
  return Array.from({ length: count + 1 }, (_, index) => start + step * index)
}

const d3 = {
  scaleLinear,
  scaleBand,
  max,
  ticks,
}

export default d3
