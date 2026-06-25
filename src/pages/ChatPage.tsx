import { useState } from 'react'
import ChannelSidebar from '../components/Chat/ChannelSidebar'
import MessageList from '../components/Chat/MessageList'
import MessageInput from '../components/Chat/MessageInput'
import { useChatContext } from '../context/ChatContext'
import { Hash, ChevronLeft } from 'lucide-react'

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const { channels } = useChatContext()
  const channelName = channels.find(c => c.id === selectedChannel)?.name ?? ''

  return (
    <div className="flex h-full">
      {/* Sidebar: auf Mobile nur sichtbar wenn kein Channel gewählt (Fullscreen) */}
      <div className={`flex-shrink-0 h-full ${
        selectedChannel
          ? 'hidden md:block md:w-52'
          : 'block w-full md:w-52'
      }`}>
        <ChannelSidebar
          selectedId={selectedChannel}
          onSelect={setSelectedChannel}
          fullWidth={!selectedChannel}
        />
      </div>

      {/* Chat-Bereich: auf Mobile nur sichtbar wenn Channel gewählt (Fullscreen) */}
      <div className={`flex-col min-w-0 bg-white ${
        selectedChannel ? 'flex flex-1' : 'hidden md:flex md:flex-1'
      }`}>
        {selectedChannel ? (
          <>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              {/* Zurück-Button nur auf Mobile */}
              <button
                className="md:hidden p-1 -ml-2 text-slate-500 hover:text-slate-700 active:text-slate-900"
                onClick={() => setSelectedChannel(null)}
                aria-label="Zurück zur Channel-Liste"
              >
                <ChevronLeft size={22} />
              </button>
              <Hash size={18} className="text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-800 text-sm truncate">{channelName}</span>
            </div>
            <MessageList channelId={selectedChannel} />
            <MessageInput channelId={selectedChannel} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-sm">Wähle einen Channel aus</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
