import { ExternalLink, FolderOpen } from 'lucide-react'

const DRIVE_FOLDER_ID = '1aiU52dQzhW32PBH9IF87tI-2oAeOdx3g'
const DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`
const DRIVE_EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}#list`

export default function ProtokolePage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-slate-500" />
          <h1 className="text-base font-semibold text-slate-800">Protokolle</h1>
        </div>
        <a
          href={DRIVE_FOLDER_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium"
          style={{ backgroundColor: 'var(--htv-blue)' }}
        >
          <ExternalLink size={13} />
          In Google Drive öffnen
        </a>
      </div>

      {/* Embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={DRIVE_EMBED_URL}
          title="Protokolle – Google Drive"
          className="w-full h-full border-0"
          allow="autoplay"
        />
      </div>
    </div>
  )
}
