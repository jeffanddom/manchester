export function shuffle<T>(items: T[]): T[] {
  const res = items.slice()
  let prev = Math.floor(Math.random() * items.length)
  for (let i = 0; i < items.length; i++) {
    const next = Math.floor(Math.random() * items.length)
    const t = res[prev]
    res[prev] = res[next]
    res[next] = t
    prev = next
  }
  return res
}

export function sample<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
