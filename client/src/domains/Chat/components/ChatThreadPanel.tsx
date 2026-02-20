import { useState, useEffect } from 'preact/hooks';
import { Button } from '@/components/ui/button';
import { IconChevronLeft, IconX } from '@tabler/icons-preact';
import { ThreadList } from './ThreadList';
import { ThreadDetail } from './ThreadDetail';
import type { Message, ChatRoom, ChatUser } from '../types';
import { useTheme } from '@/core/context/ThemeProvider';
import { cn } from '@/lib/utils';

interface ChatThreadPanelProps {
  roomId: string;
  currentRoom: ChatRoom;
  currentUser: ChatUser | null;
  onClose: () => void;
  initialSelectedMessage?: Message | null;
}

export const ChatThreadPanel = ({ 
  roomId, 
  currentUser, 
  onClose,
  initialSelectedMessage = null
}: ChatThreadPanelProps) => {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(initialSelectedMessage);

  // v2.4.2: 외부에서 initialSelectedMessage가 변경될 때 내부 상태 동기화
  useEffect(() => {
    setSelectedMessage(initialSelectedMessage);
  }, [initialSelectedMessage]);

  const handleBack = () => {
    if (selectedMessage) {
      setSelectedMessage(null);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="chat-app__sidebar-panel h-full flex flex-col bg-background border-l border-border"
    >
      <div className="chat-app__sidebar-panel__header flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 flex-1">
          {(selectedMessage || isMobile) && (
            <Button variant="ghost" size="icon" onClick={handleBack} className={cn(isMobile ? "-ml-2" : "ml-0", "h-8 w-8")}>
              <IconChevronLeft size={isMobile ? 24 : 18} />
            </Button>
          )}
          <h4 className="text-lg font-bold flex-1">
            {selectedMessage ? '스레드 상세' : '스레드'}
          </h4>
        </div>
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <IconX size={18} />
          </Button>
        )}
      </div>

      <div className="chat-app__sidebar-panel__content flex-1 overflow-hidden">
        {selectedMessage ? (
          <ThreadDetail 
            parentMessage={selectedMessage} 
            currentUser={currentUser} 
          />
        ) : (
          <ThreadList 
            roomId={roomId} 
            onThreadSelect={setSelectedMessage} 
          />
        )}
      </div>
    </div>
  );
};
