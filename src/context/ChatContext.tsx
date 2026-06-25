import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  collection, onSnapshot, query, where,
  doc, setDoc, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import type { Channel } from '../types'

type MsgDoc = { ts: Date | null; authorId: string }

interface ChatContextType {
  channels: Channel[]
  counts: Record<string, number>
  totalUnread: number
  markAsRead: (channelId: string) => void
}

const ChatContext = createContext<ChatContextType>({
  channels: [],
  counts: {},
  totalUnread: 0,
  markAsRead: () => {},
})

export function useChatContext() {
  return useContext(ChatContext)
}

export function useUnreadTotal() {
  const { totalUnread } = useContext(ChatContext)
  return { totalUnread }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, userProfile } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [msgDocs, setMsgDocs] = useState<Record<string, MsgDoc[]>>({})
  const [lastReadMap, setLastReadMap] = useState<Record<string, Date>>({})

  // Ref damit markAsRead immer die aktuellen msgDocs sieht ohne die Funktion neu zu erstellen
  const msgDocsRef = useRef<Record<string, MsgDoc[]>>({})
  msgDocsRef.current = msgDocs

  // Channels laden
  useEffect(() => {
    if (!currentUser) return
    const isGast = userProfile?.role === 'gast'
    const q = isGast
      ? query(collection(db, 'channels'), where('type', '==', 'vorstand_gaeste'))
      : collection(db, 'channels')
    return onSnapshot(q, snap => {
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() } as Channel)))
    })
  }, [currentUser, userProfile?.role])

  // lastReadMap laden – Null-Safety für serverTimestamp()-Pending-Snapshots
  useEffect(() => {
    if (!currentUser) return
    return onSnapshot(
      doc(db, 'userActivity', currentUser.uid),
      snap => {
        const data = snap.data()?.channelLastRead as Record<string, Timestamp> | undefined
        if (!data) return   // kein Dokument oder kein channelLastRead → lastReadMap bleibt {}
        const mapped: Record<string, Date> = {}
        for (const [id, ts] of Object.entries(data)) {
          if (ts && typeof (ts as Timestamp).toDate === 'function') {
            mapped[id] = (ts as Timestamp).toDate()
          }
        }
        // Nur updaten wenn sich wirklich etwas geändert hat (verhindert unnötige Re-Renders)
        // Nur neuere Timestamps übernehmen – verhindert, dass ein Firestore-Snapshot
        // das optimistische Update (markAsRead) zurücksetzt, bevor der Write bestätigt ist.
        setLastReadMap(prev => {
          const merged: Record<string, Date> = { ...prev }
          let changed = false
          for (const [id, date] of Object.entries(mapped)) {
            const prevDate = prev[id]
            if (!prevDate || date.getTime() > prevDate.getTime()) {
              merged[id] = date
              changed = true
            }
          }
          return changed ? merged : prev
        })
      },
      // Fehler-Handler: bei Firestore-Regelverstoß nie einfrieren
      err => console.warn('userActivity listener error:', err)
    )
  }, [currentUser])

  // Nachrichten pro Channel abonnieren
  useEffect(() => {
    if (!currentUser || channels.length === 0) return
    const unsubs = channels.map(ch => {
      const q = query(collection(db, 'channels', ch.id, 'messages'))
      return onSnapshot(q, snap => {
        const docs: MsgDoc[] = snap.docs.map(d => ({
          ts: (d.data().createdAt as Timestamp)?.toDate() ?? null,
          authorId: d.data().authorId as string,
        }))
        setMsgDocs(prev => ({ ...prev, [ch.id]: docs }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [currentUser, channels.map(c => c.id).join(',')])

  // Counts direkt aus React-State berechnen – kein async, kein Closure-Bug
  const counts: Record<string, number> = {}
  for (const ch of channels) {
    const lastRead = lastReadMap[ch.id]
    const msgs = msgDocs[ch.id] ?? []
    let count = 0
    for (const { ts, authorId } of msgs) {
      if (authorId === currentUser?.uid) continue          // eigene Nachrichten nie ungelesen
      if (!lastRead || (ts && ts > lastRead)) count++
    }
    counts[ch.id] = count
  }
  const totalUnread = Object.values(counts).reduce((a, b) => a + b, 0)

  // PWA Desktop-Badge
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    if (totalUnread > 0) {
      (navigator as Navigator & { setAppBadge: (n: number) => void }).setAppBadge(totalUnread)
    } else {
      (navigator as Navigator & { clearAppBadge: () => void }).clearAppBadge?.()
    }
  }, [totalUnread])

  const markAsRead = useCallback(async (channelId: string) => {
    if (!currentUser) return

    // Neuesten bestätigten Nachrichten-Timestamp + 1ms als lastRead verwenden.
    // Verhindert Server/Client-Zeitversatz: Server-Timestamps können wenige ms
    // vor new Date() liegen → Nachricht wäre sonst sofort wieder "neu".
    const msgs = msgDocsRef.current[channelId] ?? []
    let latestTs = new Date(0)
    for (const { ts } of msgs) {
      if (ts && ts > latestTs) latestTs = ts
    }
    const readTime = latestTs.getTime() > 0
      ? new Date(latestTs.getTime() + 1)
      : new Date()

    // Sofort optimistisch aktualisieren – Badge verschwindet ohne Wartezeit
    setLastReadMap(prev => ({ ...prev, [channelId]: readTime }))

    // In Firestore persistieren (Client-Timestamp → kein null-Pending-Bug)
    await setDoc(
      doc(db, 'userActivity', currentUser.uid),
      { channelLastRead: { [channelId]: Timestamp.fromDate(readTime) } },
      { merge: true }
    )
  }, [currentUser])

  return (
    <ChatContext.Provider value={{ channels, counts, totalUnread, markAsRead }}>
      {children}
    </ChatContext.Provider>
  )
}
