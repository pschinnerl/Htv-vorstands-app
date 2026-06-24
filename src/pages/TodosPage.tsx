import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import type { Todo, TodoPriority } from '../types'
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const priorityColors: Record<TodoPriority, string> = {
  hoch: 'bg-red-100 text-red-700',
  mittel: 'bg-yellow-100 text-yellow-700',
  niedrig: 'bg-green-100 text-green-700',
}

const priorityOrder: Record<TodoPriority, number> = { hoch: 0, mittel: 1, niedrig: 2 }

export default function TodosPage() {
  const { currentUser, userProfile } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'offen' | 'erledigt'>('offen')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('mittel')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const isGast = userProfile?.role === 'gast'

  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap: import('firebase/firestore').QuerySnapshot) => {
      setTodos(
        snap.docs.map((d: import('firebase/firestore').QueryDocumentSnapshot) => ({
          id: d.id,
          ...d.data(),
          createdAt: (d.data().createdAt as import('firebase/firestore').Timestamp)?.toDate() ?? new Date(),
          dueDate: d.data().dueDate ? new Date(d.data().dueDate as string) : undefined,
        } as Todo))
      )
    })
  }, [])

  async function createTodo() {
    if (!title.trim() || !currentUser) return
    await addDoc(collection(db, 'todos'), {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      assignedToName: assignedTo || null,
      done: false,
      createdBy: currentUser.uid,
      createdByName: userProfile?.displayName ?? currentUser.email,
      createdAt: serverTimestamp(),
    })
    setTitle('')
    setDescription('')
    setPriority('mittel')
    setDueDate('')
    setAssignedTo('')
    setShowForm(false)
  }

  async function toggleDone(todo: Todo) {
    await updateDoc(doc(db, 'todos', todo.id), { done: !todo.done })
  }

  async function deleteTodo(id: string) {
    if (!confirm('Aufgabe wirklich löschen?')) return
    await deleteDoc(doc(db, 'todos', id))
  }

  const filtered = todos
    .filter(t => (filter === 'offen' ? !t.done : t.done))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Aufgaben</h1>
          {!isGast && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: 'var(--htv-blue)' }}
            >
              <Plus size={16} />
              Neue Aufgabe
            </button>
          )}
        </div>

        {/* New Todo Form */}
        {showForm && !isGast && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 space-y-3">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Aufgabentitel *"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && createTodo()}
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Beschreibung (optional)"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 flex-wrap">
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TodoPriority)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 bg-white"
              >
                <option value="hoch">🔴 Hoch</option>
                <option value="mittel">🟡 Mittel</option>
                <option value="niedrig">🟢 Niedrig</option>
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              />
              <input
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                placeholder="Zuständig"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 flex-1 min-w-32"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Abbrechen
              </button>
              <button
                onClick={createTodo}
                disabled={!title.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: 'var(--htv-blue)' }}
              >
                Erstellen
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-200 rounded-lg p-1 w-fit">
          {(['offen', 'erledigt'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'offen' ? `Offen (${todos.filter(t => !t.done).length})` : `Erledigt (${todos.filter(t => t.done).length})`}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center text-slate-400 py-12 text-sm">
              {filter === 'offen' ? 'Keine offenen Aufgaben 🎉' : 'Noch nichts erledigt'}
            </div>
          )}
          {filtered.map(todo => (
            <div
              key={todo.id}
              className={`bg-white rounded-xl border px-4 py-3 flex items-start gap-3 transition-opacity ${
                todo.done ? 'opacity-60 border-slate-100' : 'border-slate-200'
              }`}
            >
              <button
                onClick={() => toggleDone(todo)}
                className="mt-0.5 flex-shrink-0 transition-colors"
                style={{ color: todo.done ? 'var(--htv-blue)' : undefined }}
              >
                {todo.done ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${todo.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {todo.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[todo.priority]}`}>
                    {todo.priority}
                  </span>
                </div>
                {todo.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{todo.description}</p>
                )}
                <div className="flex gap-3 mt-1 flex-wrap">
                  {todo.assignedToName && (
                    <span className="text-xs text-slate-400">→ {todo.assignedToName}</span>
                  )}
                  {todo.dueDate && (
                    <span className="text-xs text-slate-400">
                      📅 {format(todo.dueDate, 'd. MMM', { locale: de })}
                    </span>
                  )}
                  <span className="text-xs text-slate-300">{todo.createdByName}</span>
                </div>
              </div>

              {!isGast && (
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
