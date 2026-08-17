import raw from './stoic_quotes_full.csv?raw'

interface Quote {
  quote: string
  author: string
}

let cached: Quote[] | null = null

function parseCSVField(line: string, start: number): { value: string; next: number } {
  if (line[start] === '"') {
    let i = start + 1
    let value = ''
    while (i < line.length) {
      if (line[i] === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          value += '"'
          i += 2
        } else {
          i++
          break
        }
      } else {
        value += line[i]
        i++
      }
    }
    while (i < line.length && line[i] !== ',') i++
    return { value, next: i + 1 }
  }
  let i = start
  while (i < line.length && line[i] !== ',') i++
  return { value: line.slice(start, i), next: i + 1 }
}

function parseRow(line: string): string[] {
  const fields: string[] = []
  let pos = 0
  while (pos <= line.length) {
    const { value, next } = parseCSVField(line, pos)
    fields.push(value)
    pos = next
  }
  return fields
}

function parse(): Quote[] {
  if (cached) return cached
  const lines = raw.trim().split('\n').slice(1)
  cached = lines
    .map((line) => {
      const fields = parseRow(line)
      const quote = (fields[0] ?? '').replace(/\u201c|\u201d/g, '').trim()
      const author = (fields[1] ?? '').replace(/,$/, '').trim()
      if (!quote) return null
      return { quote, author }
    })
    .filter((q): q is Quote => q !== null)
  return cached
}

let lastIndex = -1

export function randomQuote(): Quote {
  const quotes = parse()
  if (quotes.length === 0) return { quote: '', author: '' }
  let idx: number
  do {
    idx = Math.floor(Math.random() * quotes.length)
  } while (idx === lastIndex && quotes.length > 1)
  lastIndex = idx
  return quotes[idx]
}
