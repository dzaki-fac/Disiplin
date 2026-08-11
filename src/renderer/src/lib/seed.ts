import type { FocusSession, Task } from '../types'

const at = (y: number, m: number, d: number, h: number): number =>
  new Date(y, m - 1, d, h, 0, 0, 0).getTime()

interface SeedRow {
  month: number
  day: number
  minutes: number
}

const ROWS: SeedRow[] = [
  { month: 4, day: 6, minutes: 120 },
  { month: 4, day: 7, minutes: 320 },
  { month: 4, day: 8, minutes: 205 },
  { month: 4, day: 9, minutes: 189 },
  { month: 6, day: 26, minutes: 159 },
  { month: 6, day: 27, minutes: 73 },
  { month: 6, day: 28, minutes: 250 },
  { month: 6, day: 29, minutes: 176 },
  { month: 6, day: 30, minutes: 39 },
  { month: 7, day: 4, minutes: 64 },
  { month: 7, day: 5, minutes: 127 },
  { month: 8, day: 6, minutes: 119 },
  { month: 8, day: 7, minutes: 132 },
  { month: 8, day: 8, minutes: 98 },
  { month: 8, day: 9, minutes: 234 },
  { month: 8, day: 10, minutes: 231 }
]

const startedAtFor = (r: SeedRow): number => at(2026, r.month, r.day, 9)

export const SEED_TASK_ID = 'seed-task-gaya-hidup'

export const SEED_TASK: Task = {
  id: SEED_TASK_ID,
  title: 'Gaya Hidup Disiplin',
  done: false,
  createdAt: startedAtFor(ROWS[0]),
  completedAt: null
}

export const SEED_SESSIONS: FocusSession[] = ROWS.map((r) => {
  const startedAt = startedAtFor(r)
  return {
    id: `seed-2026-${r.month}-${r.day}`,
    taskId: null,
    taskTitle: SEED_TASK.title,
    minutes: r.minutes,
    startedAt,
    completedAt: startedAt + r.minutes * 60_000
  }
})

const plan = (id: string, week: number, title: string, createdAt: number): Task => ({
  id,
  title,
  week,
  done: false,
  createdAt,
  completedAt: null
})

const t = (d: number): number => at(2026, 7, d, 9)
const tAug = (d: number): number => at(2026, 8, d, 9)

export const TRAINING_TASKS: Task[] = [
  plan(
    'plan-w1-tue',
    1,
    'Selasa: Virtual Contest Codeforces Div. 3 (2 jam), lalu upsolve semua soal yang belum AC.',
    t(7)
  ),
  plan(
    'plan-w1-wed',
    1,
    'Rabu: Greedy (5 soal), Binary Search (5 soal). Baca editorial jika buntu >45 menit.',
    t(8)
  ),
  plan(
    'plan-w1-thu',
    1,
    'Kamis: Virtual Contest AtCoder Beginner Contest, lalu upsolve dan review bug implementasi.',
    t(9)
  ),
  plan(
    'plan-w1-fri',
    1,
    'Jumat: Prefix Sum, Two Pointers, Sliding Window (8 sampai 10 soal).',
    t(10)
  ),
  plan('plan-w1-sat', 1, 'Sabtu: Graph I, DFS, BFS, Flood Fill, Grid (6 sampai 8 soal).', t(11)),
  plan(
    'plan-w1-sun',
    1,
    'Minggu: Simulasi kontes (3 sampai 5 jam), lalu upsolve seluruh soal yang belum selesai.',
    t(12)
  ),

  plan('plan-w2-mon', 2, 'Senin: Dijkstra dan Shortest Path (5 sampai 6 soal).', t(13)),
  plan('plan-w2-tue', 2, 'Selasa: DSU dan Minimum Spanning Tree (5 sampai 6 soal).', t(14)),
  plan('plan-w2-wed', 2, 'Rabu: Topological Sort dan DAG (5 soal).', t(15)),
  plan('plan-w2-thu', 2, 'Kamis: Virtual Contest Codeforces, lalu upsolve.', t(16)),
  plan('plan-w2-fri', 2, 'Jumat: Tree dan LCA dasar (5 soal).', t(17)),
  plan('plan-w2-sat', 2, 'Sabtu: Dynamic Programming dasar (5 soal).', t(18)),
  plan(
    'plan-w2-sun',
    2,
    'Minggu: Simulasi GEMASTIK (5 jam), lalu review seluruh kesalahan.',
    t(19)
  ),

  plan('plan-w3-mon', 3, 'Senin: Dynamic Programming lanjutan (5 soal).', t(20)),
  plan('plan-w3-tue', 3, 'Selasa: Bitmask DP (4 sampai 5 soal).', t(21)),
  plan('plan-w3-wed', 3, 'Rabu: Segment Tree (5 soal).', t(22)),
  plan('plan-w3-thu', 3, 'Kamis: Fenwick Tree (5 soal).', t(23)),
  plan('plan-w3-fri', 3, 'Jumat: Virtual Contest AtCoder atau Codeforces, lalu upsolve.', t(24)),
  plan('plan-w3-sat', 3, 'Sabtu: String Algorithms, KMP, Hashing (5 soal).', t(25)),
  plan('plan-w3-sun', 3, 'Minggu: Simulasi kontes (5 jam), lalu upsolve.', t(26)),

  plan('plan-w4-mon', 4, 'Senin: Number Theory, GCD, Modular Arithmetic (5 soal).', t(27)),
  plan('plan-w4-tue', 4, 'Selasa: Combinatorics (5 soal).', t(28)),
  plan('plan-w4-wed', 4, 'Rabu: Geometry dasar (4 sampai 5 soal).', t(29)),
  plan('plan-w4-thu', 4, 'Kamis: Arsip soal GEMASTIK (minimal 4 soal).', t(30)),
  plan('plan-w4-fri', 4, 'Jumat: Virtual Contest penuh, lalu upsolve.', t(31)),
  plan(
    'plan-w4-sat',
    4,
    'Sabtu: Review seluruh topik yang masih lemah, rapikan template, ulangi soal yang pernah gagal.',
    tAug(1)
  ),
  plan(
    'plan-w4-sun',
    4,
    'Minggu: Simulasi ringan (2 sampai 3 soal), review catatan, istirahat cukup, jangan belajar materi baru.',
    tAug(2)
  )
]
