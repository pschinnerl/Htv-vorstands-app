import { useState } from 'react'
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, CheckCircle2 } from 'lucide-react'

export default function ProfilPage() {
  const { currentUser, userProfile } = useAuth()

  // Name
  const [name, setName] = useState(userProfile?.displayName ?? '')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)

  // E-Mail
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)

  // Passwort
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function saveName() {
    if (!name.trim() || !currentUser) return
    setNameSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { displayName: name.trim() })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } finally {
      setNameSaving(false)
    }
  }

  async function saveEmail() {
    if (!newEmail.trim() || !emailPassword || !currentUser) return
    setEmailSaving(true)
    setEmailError('')
    try {
      const cred = EmailAuthProvider.credential(currentUser.email!, emailPassword)
      await reauthenticateWithCredential(currentUser, cred)
      await updateEmail(currentUser, newEmail.trim())
      await updateDoc(doc(db, 'users', currentUser.uid), { email: newEmail.trim().toLowerCase() })
      setEmailSuccess(true)
      setNewEmail('')
      setEmailPassword('')
      setTimeout(() => setEmailSuccess(false), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setEmailError('Aktuelles Passwort ist falsch.')
      } else if (msg.includes('email-already-in-use')) {
        setEmailError('Diese E-Mail-Adresse ist bereits vergeben.')
      } else {
        setEmailError('Fehler beim Ändern der E-Mail.')
      }
    } finally {
      setEmailSaving(false)
    }
  }

  async function savePassword() {
    if (!currentPassword || !newPassword || !confirmPassword || !currentUser) return
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Neue Passwörter stimmen nicht überein.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    setPasswordSaving(true)
    try {
      const cred = EmailAuthProvider.credential(currentUser.email!, currentPassword)
      await reauthenticateWithCredential(currentUser, cred)
      await updatePassword(currentUser, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setPasswordError('Aktuelles Passwort ist falsch.')
      } else {
        setPasswordError('Fehler beim Ändern des Passworts.')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold text-slate-800">Mein Profil</h1>

        {/* Avatar + Übersicht */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ backgroundColor: 'var(--htv-blue)' }}
          >
            {userProfile?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{userProfile?.displayName}</div>
            <div className="text-sm text-slate-400">{currentUser?.email}</div>
            <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-block font-medium">
              {userProfile?.role === 'admin' ? 'Admin' : userProfile?.role === 'vorstand' ? 'Vorstand' : 'Gast'}
            </div>
          </div>
        </div>

        {/* Name ändern */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-slate-400" />
            <h2 className="font-medium text-slate-800">Anzeigename</h2>
          </div>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dein Name"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <button
              onClick={saveName}
              disabled={nameSaving || name.trim() === userProfile?.displayName}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 flex items-center gap-2"
              style={{ backgroundColor: 'var(--htv-blue)' }}
            >
              {nameSuccess ? <><CheckCircle2 size={14} /> Gespeichert</> : nameSaving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* E-Mail ändern */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-slate-400" />
            <h2 className="font-medium text-slate-800">E-Mail-Adresse ändern</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Aktuell: {currentUser?.email}</p>
          <div className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Neue E-Mail-Adresse"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
            <input
              type="password"
              value={emailPassword}
              onChange={e => setEmailPassword(e.target.value)}
              placeholder="Aktuelles Passwort zur Bestätigung"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
            {emailError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{emailError}</p>}
            {emailSuccess && (
              <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> E-Mail-Adresse erfolgreich geändert.
              </p>
            )}
            <button
              onClick={saveEmail}
              disabled={emailSaving || !newEmail.trim() || !emailPassword}
              className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--htv-blue)' }}
            >
              {emailSaving ? 'Wird gespeichert…' : 'E-Mail ändern'}
            </button>
          </div>
        </div>

        {/* Passwort ändern */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-slate-400" />
            <h2 className="font-medium text-slate-800">Passwort ändern</h2>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Aktuelles Passwort"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Neues Passwort (min. 8 Zeichen)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Neues Passwort wiederholen"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && savePassword()}
            />
            {passwordError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{passwordError}</p>}
            {passwordSuccess && (
              <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> Passwort erfolgreich geändert.
              </p>
            )}
            <button
              onClick={savePassword}
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--htv-blue)' }}
            >
              {passwordSaving ? 'Wird gespeichert…' : 'Passwort ändern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
