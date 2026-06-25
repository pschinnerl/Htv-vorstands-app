import { useEffect, useState } from 'react'
import {
  collection, addDoc, serverTimestamp,
  updateDoc, deleteDoc, doc as firestoreDoc,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useChatContext } from '../../context/ChatContext'
import type { Channel, ChannelType } from '../../types'
import { Hash, Plus, X, MoreHorizontal, Pencil, Trash2, Check } from 'lucide-react'

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Auf Mobile die volle Breite nutzen statt w-52 */
  fullWidth?: boolean
}

export default function ChannelSidebar({ selectedId, onSelect, fullWidth }: Props) {
  const { currentUser, userProfile } = useAuth()
  const { channels, counts, markAsRead } = useChatContext()

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<ChannelType>('vorstand')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const isGast = userProfile?.role === 'gast'
  const isAdmin = userProfile?.role === 'admin'

  // Menü bei Klick außerhalb schließen
  useEffect(() => {
    if (!openMenuId) return
    function close() { setOpenMenuId(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  async function createChannel() {
    if (!newName.trim() || !currentUser) return
    await addDoc(collection(db, 'channels'), {
      name: newName.trim(),
      type: newType,
      members: [currentUser.uid],
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
    })
    setNewName('')
    setShowNew(false)
  }

  async function renameChannel(channelId: string) {
    if (!editName.trim()) { setEditingId(null); return }
    await updateDoc(firestoreDoc(db, 'channels', channelId), { name: editName.trim() })
    setEditingId(null)
    setEditName('')
  }

  async function deleteChannel(channelId: string) {
    if (!window.confirm('Channel wirklich löschen? Alle Nachrichten gehen verloren.')) return
    await deleteDoc(firestoreDoc(db, 'channels', channelId))
    if (selectedId === channelId) onSelect(null)
  }

  function startEdit(ch: Channel) {
    setEditingId(ch.id)
    setEditName(ch.name)
    setOpenMenuId(null)
  }

  function handleSelect(channelId: string) {
    onSelect(channelId)
    markAsRead(channelId)
  }

  const visibleChannels = isGast
    ? channels.filter(c => c.type === 'vorstand_gaeste')
    : channels

  const groups: Record<string, Channel[]> = {
    Vorstand: visibleChannels.filter(c => c.type === 'vorstand'),
    'Vorstand & Gäste': visibleChannels.filter(c => c.type === 'vorstand_gaeste'),
    Projekte: visibleChannels.filter(c => c.type === 'projekt'),
  }

  return (
    <div className={`${fullWidth ? 'w-full' : 'w-52'} flex-shrink-0 bg-slate-800 flex flex-col h-full`}>
      <div className="px-3 py-3 flex items-center justify-between border-b border-slate-700">
        <span className="text-white font-medium text-sm">Channels</span>
        {!isGast && (
          <button onClick={() => setShowNew(v => !v)} className="text-slate-400 hover:text-white transition-colors">
            {showNew ? <X size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      {showNew && (
        <div className="px-3 py-3 border-b border-slate-700 space-y-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Channel-Name"
            className="w-full bg-slate-700 text-white text-sm rounded px-2 py-1.5 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            onKeyDown={e => e.key === 'Enter' && createChannel()}
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as ChannelType)}
            className="w-full bg-slate-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="vorstand">Vorstand</option>
            <option value="vorstand_gaeste">Vorstand & Gäste</option>
            <option value="projekt">Projekt</option>
          </select>
          <button
            onClick={createChannel}
            className="w-full text-sm py-1.5 rounded text-white font-medium"
            style={{ backgroundColor: 'var(--htv-blue-light)' }}
          >
            Erstellen
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(groups).map(([label, list]) => {
          if (list.length === 0) return null
          return (
            <div key={label} className="mb-3">
              <div className="px-3 py-1 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                {label}
              </div>
              {list.map(ch => {
                const unread = counts[ch.id] ?? 0
                const isSelected = selectedId === ch.id
                const isEditing = editingId === ch.id

                if (isEditing) {
                  return (
                    <div key={ch.id} className="flex items-center gap-1 px-2 py-1">
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') renameChannel(ch.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 min-w-0 bg-slate-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <button onClick={() => renameChannel(ch.id)} className="text-green-400 hover:text-green-300 flex-shrink-0">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  )
                }

                return (
                  <div
                    key={ch.id}
                    className={`group relative flex items-center transition-colors ${
                      isSelected ? 'bg-slate-600' : 'hover:bg-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => handleSelect(ch.id)}
                      className={`flex-1 flex items-center gap-2 pl-3 py-1.5 pr-1 text-sm text-left min-w-0 ${
                        isSelected
                          ? 'text-white'
                          : unread > 0
                          ? 'text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Hash size={14} className="flex-shrink-0" />
                      <span className="truncate">{ch.name}</span>
                    </button>

                    <div className="flex items-center gap-0.5 pr-1 flex-shrink-0">
                      {unread > 0 && !isSelected && (
                        <span className={`bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${isAdmin ? 'group-hover:hidden' : ''}`}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                      {isAdmin && (
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(prev => prev === ch.id ? null : ch.id) }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white rounded transition-opacity"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenuId === ch.id && (
                            <div
                              className="absolute right-0 top-full mt-0.5 z-50 bg-slate-700 border border-slate-600 rounded shadow-lg py-1 min-w-[140px]"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => startEdit(ch)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600"
                              >
                                <Pencil size={12} />
                                Umbenennen
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); deleteChannel(ch.id) }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-600"
                              >
                                <Trash2 size={12} />
                                Löschen
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
