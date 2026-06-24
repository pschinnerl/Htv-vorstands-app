import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { Send, Link, X, ExternalLink } from 'lucide-react'

interface Props {
  channelId: string
}

// Ermittelt Dateiname aus Google Drive / Dropbox Link
function getLinkLabel(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('drive.google.com')) return 'Google Drive Datei'
    if (u.hostname.includes('dropbox.com')) return 'Dropbox Datei'
    if (u.hostname.includes('docs.google.com')) {
      if (u.pathname.includes('/document/')) return 'Google Dokument'
      if (u.pathname.includes('/spreadsheets/')) return 'Google Tabelle'
      if (u.pathname.includes('/presentation/')) return 'Google Präsentation'
    }
    return u.hostname.replace('www.', '')
  } catch {
    return 'Datei-Link'
  }
}

export default function MessageInput({ channelId }: Props) {
  const { currentUser, userProfile } = useAuth()
  const [text, setText] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [driveLink, setDriveLink] = useState('')
  const [sending, setSending] = useState(false)
  const linkInputRef = useRef<HTMLInputElement>(null)

  function toggleLinkInput() {
    setShowLinkInput(v => !v)
    setDriveLink('')
    setTimeout(() => linkInputRef.current?.focus(), 50)
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!currentUser || (!text.trim() && !driveLink.trim())) return

    setSending(true)
    try {
      const linkUrl = driveLink.trim()
      await addDoc(collection(db, 'channels', channelId, 'messages'), {
        text: text.trim(),
        authorId: currentUser.uid,
        authorName: userProfile?.displayName ?? currentUser.email,
        createdAt: serverTimestamp(),
        ...(linkUrl && {
          fileUrl: linkUrl,
          fileName: getLinkLabel(linkUrl),
          fileType: 'link',
        }),
      })
      setText('')
      setDriveLink('')
      setShowLinkInput(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={send} className="px-4 py-3 bg-white border-t border-slate-200">
      {/* Drive-Link Eingabe */}
      {showLinkInput && (
        <div className="mb-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <ExternalLink size={14} className="text-blue-400 flex-shrink-0" />
          <input
            ref={linkInputRef}
            type="url"
            value={driveLink}
            onChange={e => setDriveLink(e.target.value)}
            placeholder="Google Drive / Docs Link einfügen…"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send(e as unknown as FormEvent)
              }
              if (e.key === 'Escape') { setShowLinkInput(false); setDriveLink('') }
            }}
          />
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setDriveLink('') }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Drive-Link Button */}
        <button
          type="button"
          onClick={toggleLinkInput}
          title="Google Drive Link einfügen"
          className={`flex-shrink-0 transition-colors ${
            showLinkInput ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Link size={20} />
        </button>

        {/* Nachrichtenfeld */}
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={showLinkInput ? 'Kommentar zur Datei (optional)…' : 'Nachricht schreiben…'}
          className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(e as unknown as FormEvent)
            }
          }}
          disabled={sending}
        />

        {/* Senden */}
        <button
          type="submit"
          disabled={sending || (!text.trim() && !driveLink.trim())}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-30"
          style={{ backgroundColor: 'var(--htv-blue)' }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* Hinweistext */}
      {showLinkInput && !driveLink && (
        <p className="text-xs text-slate-400 mt-1.5 pl-1">
          Datei zuerst in <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="underline">Google Drive</a> hochladen → Teilen → Link kopieren → hier einfügen
        </p>
      )}
    </form>
  )
}
