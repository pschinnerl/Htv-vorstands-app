import { useEffect, useRef, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Message } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useChatContext } from '../../context/ChatContext'
import { ExternalLink, SmilePlus } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const QUICK_EMOJIS = ['ð', 'â¤ï¸', 'ð', 'ð', 'ð', 'â']

function getDriveIcon(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('docs.google.com')) {
      if (u.pathname.includes('/document/')) return 'ð'
      if (u.pathname.includes('/spreadsheets/')) return 'ð'
      if (u.pathname.includes('/presentation/')) return 'ð'
    }
    if (u.hostname.includes('drive.google.com')) return 'ð'
    if (u.hostname.includes('dropbox.com')) return 'ð¦'
  } catch { /* noop */ }
  return 'ð'
}

interface Props {
  channelId: string
}

export default function MessageList({ channelId }: Props) {
  const { currentUser } = useAuth()
  const { markAsRead } = useChatContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [pickerOpen, setPickerOpen] = useState<string | null>(null) // message id
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'channels', channelId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    )
    return onSnapshot(q, (snap: import('firebase/firestore').QuerySnapshot) => {
      setMessages(
        snap.docs.map((d: import('firebase/firestore').QueryDocumentSnapshot) => ({
          id: d.id,
          ...d.data(),
          createdAt: (d.data().createdAt as import('firebase/firestore').Timestamp)?.toDate() ?? new Date(),
        } as Message))
      )
    })
  }, [channelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!channelId || messages.length === 0) return
    const timer = setTimeout(() => markAsRead(channelId), 500)
    return () => clearTimeout(timer)
  }, [messages.length, channelId])

  async function toggleReaction(msg: Message, emoji: string) {
    if (!currentUser) return
    const uid = currentUser.uid
    const msgRef = doc(db, 'channels', channelId, 'messages', msg.id)
    const existing = msg.reactions?.[emoji] ?? []
    const hasReacted = existing.includes(uid)

    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
    })
    setPickerOpen(null)
  }

  function formatTime(date: Date) {
    return format(date, 'HH:mm', { locale: de })
  }

  function formatDate(date: Date) {
    return format(date, 'EEEE, d. MMMM', { locale: de })
  }

  let lastDate = ''

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" onClick={() => setPickerOpen(null)}>
      {messages.map(msg => {
        const isOwn = msg.authorId === currentUser?.uid
        const dateStr = formatDate(msg.createdAt)
        const showDate = dateStr !== lastDate
        lastDate = dateStr
        const reactionEntries = Object.entries(msg.reactions ?? {}).filter(([, uids]) => uids.length > 0)

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">{dateStr}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            <div className={`group flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {!isOwn && (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: 'var(--htv-blue)' }}
                >
                  {msg.authorName?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isOwn && (
                  <span className="text-xs text-slate-500 px-1">{msg.authorName}</span>
                )}

                {/* Drive / Link Karte */}
                {msg.fileUrl && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`rounded-xl px-3 py-2.5 text-sm flex items-center gap-2.5 max-w-xs transition-opacity hover:opacity-80 ${
                      isOwn
                        ? 'text-white border border-white/20'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                    style={isOwn ? { backgroundColor: 'var(--htv-blue-dark)' } : {}}
                  >
                    <span className="text-base flex-shrink-0">{getDriveIcon(msg.fileUrl)}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-xs">{msg.fileName}</div>
                      <div className={`text-xs truncate mt-0.5 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
                        {msg.fileUrl.length > 40 ? msg.fileUrl.slice(0, 40) + 'â¦' : msg.fileUrl}
                      </div>
                    </div>
                    <ExternalLink size={13} className={`flex-shrink-0 ${isOwn ? 'text-white/60' : 'text-slate-400'}`} />
                  </a>
                )}

                {/* Text bubble + Emoji-Button */}
                {msg.text && (
                  <div className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        isOwn
                          ? 'text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}
                      style={isOwn ? { backgroundColor: 'var(--htv-blue)' } : {}}
                    >
                      {msg.text}
                    </div>

                    {/* Reaktions-Button (erscheint beim Hover) */}
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); setPickerOpen(pickerOpen === msg.id ? null : msg.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 text-slate-400"
                        title="Reaktion hinzufÃ¼gen"
                      >
                        <SmilePlus size={16} />
                      </button>

                      {/* Emoji-Picker */}
                      {pickerOpen === msg.id && (
                        <div
                          className={`absolute bottom-8 z-10 bg-white border border-slate-200 rounded-xl shadow-lg px-2 py-1.5 flex gap-1 ${isOwn ? 'right-0' : 'left-0'}`}
                          onClick={e => e.stopPropagation()}
                        >
                          {QUICK_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg, emoji)}
                              className={`text-lg hover:scale-125 transition-transform rounded px-0.5 ${
                                msg.reactions?.[emoji]?.includes(currentUser?.uid ?? '') ? 'bg-blue-100' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reaktionen anzeigen */}
                {reactionEntries.length > 0 && (
                  <div className={`flex flex-wrap gap-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {reactionEntries.map(([emoji, uids]) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg, emoji)}
                        className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors ${
                          uids.includes(currentUser?.uid ?? '')
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{uids.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-xs text-slate-400 px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
