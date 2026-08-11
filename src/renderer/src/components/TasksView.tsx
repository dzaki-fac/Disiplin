import { useMemo, useState, type DragEvent } from 'react'
import type { Task } from '../types'
import { useStore } from '../lib/storeContext'
import { AnimatedInView } from './AnimatedInView'
import { CheckIcon, ChevronRightIcon, GripIcon, PencilIcon, TrashIcon } from './icons'

const WEEK_ORDER = [1, 2, 3, 4]

interface TaskGroup {
  week: number
  tasks: Task[]
}

function orderGroups(groups: TaskGroup[], groupOrder: number[]): TaskGroup[] {
  const known = groupOrder.filter((w) => groups.some((g) => g.week === w))
  const rest = groups.filter((g) => !known.includes(g.week))
  return [...known.map((w) => groups.find((g) => g.week === w) as TaskGroup), ...rest]
}

function buildGroups(tasks: Task[]): TaskGroup[] {
  const map = new Map<number, Task[]>()
  const rest: Task[] = []
  const sorted = [...tasks].sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
  for (const t of sorted) {
    if (t.week) {
      const arr = map.get(t.week)
      if (arr) arr.push(t)
      else map.set(t.week, [t])
    } else {
      rest.push(t)
    }
  }
  const buckets = WEEK_ORDER.map((w) => ({ week: w, tasks: map.get(w) ?? [] })).filter(
    (g) => g.tasks.length > 0
  )
  if (rest.length > 0) buckets.push({ week: 0, tasks: rest })
  return buckets
}

function TaskRow({ task }: { task: Task }): React.JSX.Element {
  const { toggleTask, deleteTask } = useStore()
  return (
    <AnimatedInView key={task.id} className="task">
      <button
        type="button"
        className="task__check"
        onClick={() => toggleTask(task.id)}
        aria-label={`Selesaikan ${task.title}`}
      >
        <span className={`task__check-box${task.done ? ' is-checked' : ''}`}>
          {task.done && <CheckIcon size={14} />}
        </span>
      </button>
      <div className="task__body">
        <span className={`task__title${task.done ? ' task__title--done' : ''}`}>{task.title}</span>
      </div>
      <button
        type="button"
        className="task__delete"
        onClick={() => deleteTask(task.id)}
        aria-label={`Hapus ${task.title}`}
      >
        <TrashIcon size={18} />
      </button>
    </AnimatedInView>
  )
}

function TaskManager({
  groups,
  groupLabel
}: {
  groups: TaskGroup[]
  groupLabel: (w: number) => string
}): React.JSX.Element {
  const {
    setWeekName,
    renameTask,
    reorderTask,
    reorderGroup,
    deleteTask,
    addTask,
    addTaskGroup,
    deleteTaskGroup
  } = useStore()
  const [dragType, setDragType] = useState<'task' | 'group' | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [newTitles, setNewTitles] = useState<Record<number, string>>({})
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const toggleCollapse = (week: number): void =>
    setCollapsed((prev) => ({ ...prev, [week]: !prev[week] }))

  const onTaskDragStart = (e: DragEvent<HTMLElement>, id: string): void => {
    setDragType('task')
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onGroupDragStart = (e: DragEvent<HTMLElement>, week: number): void => {
    setDragType('group')
    setDragId(String(week))
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: DragEvent<HTMLElement>, id: string): void => {
    e.preventDefault()
    if (id !== overId) setOverId(id)
  }

  const onDrop = (e: DragEvent<HTMLElement>, targetId: string): void => {
    e.preventDefault()
    if (dragType === 'task' && dragId) reorderTask(dragId, targetId)
    else if (dragType === 'group' && dragId) reorderGroup(Number(dragId), Number(targetId))
    setDragType(null)
    setDragId(null)
    setOverId(null)
  }

  const onDragEnd = (): void => {
    setDragType(null)
    setDragId(null)
    setOverId(null)
  }

  const submitNew = (e: React.FormEvent, week: number): void => {
    e.preventDefault()
    const value = (newTitles[week] ?? '').trim()
    if (!value) return
    addTask(value, week)
    setNewTitles((prev) => ({ ...prev, [week]: '' }))
  }

  return (
    <section className="task-manager">
      <div className="task-manager__head">
        <h2>Edit Tugas</h2>
        <button type="button" className="cta cta--ghost" onClick={addTaskGroup}>
          + Bagian baru
        </button>
        <span className="task-manager__hint">seret (grip) untuk mengubah urutan</span>
      </div>
      {groups.map((group) => (
        <div
          key={group.week}
          className={`task-manager__group${
            dragType === 'group' && dragId === String(group.week) ? ' is-dragging' : ''
          }${dragType === 'group' && overId === String(group.week) ? ' is-over' : ''}`}
        >
          <div
            className="task-manager__group-head"
            onDragOver={(e) => onDragOver(e, String(group.week))}
            onDrop={(e) => onDrop(e, String(group.week))}
          >
            <button
              type="button"
              className="task-manager__collapse"
              aria-label={collapsed[group.week] ? 'Tampilkan rincian' : 'Minimalkan'}
              onClick={() => toggleCollapse(group.week)}
            >
              <span className={`task-manager__caret${collapsed[group.week] ? '' : ' is-open'}`}>
                <ChevronRightIcon size={14} />
              </span>
            </button>
            <span
              className="task-manager__handle"
              draggable
              onDragStart={(e) => onGroupDragStart(e, group.week)}
              onDragEnd={onDragEnd}
            >
              <GripIcon size={16} />
            </span>
            <input
              className="task-manager__group-name"
              type="text"
              maxLength={60}
              defaultValue={groupLabel(group.week)}
              onBlur={(e) => setWeekName(group.week, e.target.value)}
            />
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              aria-label={`Hapus bagian ${groupLabel(group.week)}`}
              onClick={() => {
                if (
                  window.confirm(`Hapus bagian "${groupLabel(group.week)}" beserta semua tugasnya?`)
                )
                  deleteTaskGroup(group.week)
              }}
            >
              <TrashIcon size={16} />
            </button>
          </div>
          {!collapsed[group.week] && (
            <>
              <ul className="task-manager__list">
                {group.tasks.map((task) => (
                  <li
                    key={task.id}
                    className={`task-manager__item${
                      dragType === 'task' && dragId === task.id ? ' is-dragging' : ''
                    }${dragType === 'task' && overId === task.id ? ' is-over' : ''}`}
                    onDragOver={(e) => onDragOver(e, task.id)}
                    onDrop={(e) => onDrop(e, task.id)}
                  >
                    <span
                      className="task-manager__handle"
                      draggable
                      onDragStart={(e) => onTaskDragStart(e, task.id)}
                      onDragEnd={onDragEnd}
                    >
                      <GripIcon size={16} />
                    </span>
                    <input
                      className="task-manager__task-name"
                      type="text"
                      maxLength={120}
                      defaultValue={task.title}
                      onBlur={(e) => renameTask(task.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label={`Hapus ${task.title}`}
                      onClick={() => deleteTask(task.id)}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <form className="task-manager__add" onSubmit={(e) => submitNew(e, group.week)}>
                <input
                  type="text"
                  placeholder="Tambah tugas di bagian ini..."
                  maxLength={120}
                  value={newTitles[group.week] ?? ''}
                  onChange={(e) =>
                    setNewTitles((prev) => ({ ...prev, [group.week]: e.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="cta cta--primary"
                  disabled={!(newTitles[group.week] ?? '').trim()}
                >
                  +
                </button>
              </form>
            </>
          )}
        </div>
      ))}
    </section>
  )
}

export function TasksView(): React.JSX.Element {
  const { tasks, weekNames, groupOrder } = useStore()
  const [editOpen, setEditOpen] = useState(false)

  const groups = useMemo(() => orderGroups(buildGroups(tasks), groupOrder), [tasks, groupOrder])

  const managerGroups = useMemo(() => {
    const built = buildGroups(tasks)
    const registered = [...new Set([...Object.keys(weekNames).map(Number), ...groupOrder])].filter(
      (w) => !built.some((g) => g.week === w)
    )
    return orderGroups(
      [...built, ...registered.map((w) => ({ week: w, tasks: [] as Task[] }))],
      groupOrder
    )
  }, [tasks, weekNames, groupOrder])
  const active = groups.filter((g) => g.tasks.some((t) => !t.done))
  const completed = groups.filter((g) => g.tasks.every((t) => t.done))

  const groupLabel = (week: number): string =>
    weekNames[String(week)] || (week === 0 ? 'Umum' : `Minggu ${week}`)

  const open = tasks.filter((t) => !t.done).length
  const done = tasks.length - open

  return (
    <div className="view">
      <header className="view__header">
        <h1>Tugas</h1>
        <p className="view__sub">
          {open} tugas aktif · {done} selesai
        </p>
        <button
          type="button"
          className={`view-edit-toggle${editOpen ? ' is-open' : ''}`}
          aria-label="Edit tugas"
          aria-expanded={editOpen}
          onClick={() => setEditOpen((o) => !o)}
        >
          <PencilIcon size={18} />
        </button>
      </header>

      {editOpen && <TaskManager groups={managerGroups} groupLabel={groupLabel} />}

      {tasks.length === 0 && (
        <div className="empty-state">
          <p>Belum ada tugas.</p>
          <p className="empty-state__sub">Kelola tugas lewat tombol edit di pojok atas.</p>
        </div>
      )}

      {active.map((group) => (
        <section key={group.week} className="task-group">
          <AnimatedInView as="h2" className="task-group__title">
            {groupLabel(group.week)}
          </AnimatedInView>
          <ul className="task-list">
            {group.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </section>
      ))}

      {completed.length > 0 && (
        <section className="done-section">
          <h2 className="done-section__title">Selesai</h2>
          {completed.map((group) => (
            <div key={group.week} className="task-group">
              <AnimatedInView as="h3" className="task-group__title">
                {groupLabel(group.week)}
              </AnimatedInView>
              <ul className="task-list">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
