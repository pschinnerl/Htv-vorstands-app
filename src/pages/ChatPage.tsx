import { useState } from 'react'
import ChannelSidebar from '../components/Chat/ChannelSidebar'
import MessageList from '../components/Chat/MessageList'
import MessageInput from '../components/Chat/MessageInput'
import { Hash } from 'lucide-react'

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  return (
    <div className="flex h-full">
      <ChannelSidebar selectedId={selectedChannel} onSelect={(id) => setSelectedChannel(id)} />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedChannel ? (
          <>
            <div
              className="px-4 py-3 border-b border-slate-200 flex items-center gap-2"
              style={{ borderTopColor: 'transparent' }}
            >
              <Hash size={18} className="text-slate-400" />
              <span className="font-medium text-slate-800 text-sm">Channel</span>
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
