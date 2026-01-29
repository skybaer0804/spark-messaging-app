import { useMemo } from 'preact/hooks';
import { Autocomplete, AutocompleteOption } from '@/ui-components/Autocomplete/Autocomplete';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconHash, IconLock, IconHierarchy, IconUser } from '@tabler/icons-preact';
import type { ChatRoom, ChatUser } from '../types';

export interface AutocompleteAllProps {
  roomList: ChatRoom[];
  userList: ChatUser[];
  selectedTarget: (ChatRoom | ChatUser) | null;
  onTargetChange: (target: (ChatRoom | ChatUser) | null) => void;
  excludeRoomId?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

type CombinedItem = (ChatRoom | ChatUser) & { __type: 'room' | 'user' };

export function AutocompleteAll({
  roomList,
  userList,
  selectedTarget,
  onTargetChange,
  excludeRoomId,
  placeholder = '채널 또는 사용자 검색',
  label = '대상 선택',
  helperText,
  error = false,
  disabled = false,
  fullWidth = true,
}: AutocompleteAllProps) {
  // 룸과 사용자 목록 병합
  const combinedList = useMemo(() => {
    const rooms = roomList
      .filter((r) => r._id !== excludeRoomId && ['public', 'private', 'team'].includes(r.type))
      .map((r) => ({ ...r, __type: 'room' as const }));

    const users = userList
      .map((u) => ({ ...u, __type: 'user' as const }));

    return [...rooms, ...users];
  }, [roomList, userList, excludeRoomId]);

  // Autocomplete 옵션으로 변환
  const options: AutocompleteOption<CombinedItem>[] = useMemo(() => {
    return combinedList.map((item) => ({
      label: item.__type === 'room' 
        ? (item as ChatRoom).name || (item as ChatRoom).displayName || '' 
        : (item as ChatUser).username || '',
      value: item as CombinedItem,
    }));
  }, [combinedList]);

  // 옵션 필터링
  const filterOptions = (options: AutocompleteOption<CombinedItem>[], inputValue: string): AutocompleteOption<CombinedItem>[] => {
    if (!inputValue.trim()) {
      return options;
    }

    const lowerInput = inputValue.toLowerCase();
    return options.filter((option) => {
      const item = option.value;
      const name = item.__type === 'room'
        ? ((item as ChatRoom).name || (item as ChatRoom).displayName || '').toLowerCase()
        : (item as ChatUser).username.toLowerCase();
      
      const email = item.__type === 'user' ? (item as ChatUser).email?.toLowerCase() : '';
      
      return name.includes(lowerInput) || (email && email.includes(lowerInput));
    });
  };

  // 사용자와의 DM 룸 찾기
  const findDirectRoomWithUser = (userId: string): ChatRoom | null => {
    return roomList.find((room) => {
      if (room.type !== 'direct') return false;
      // 다이렉트 룸의 멤버가 2명이고, 그 중 하나가 해당 사용자인지 확인
      const members = room.members || [];
      return members.length === 2 && members.some((m: any) => {
        const memberId = typeof m === 'object' ? m._id : m;
        return memberId === userId;
      });
    }) || null;
  };

  // 아이콘 및 아바타 렌더링
  const renderOption = (option: AutocompleteOption<CombinedItem>) => {
    const item = option.value;
    const isRoom = item.__type === 'room';
    const isUser = item.__type === 'user';

    let icon = <IconUser size={18} />;
    let existingDMRoom: ChatRoom | null = null;

    if (isRoom) {
      const room = item as ChatRoom;
      switch (room.type) {
        case 'public': icon = <IconHash size={18} />; break;
        case 'private': icon = <IconLock size={18} />; break;
        case 'team': icon = <IconHierarchy size={18} />; break;
      }
    } else if (isUser) {
      // 사용자의 경우 기존 DM 룸이 있는지 확인
      existingDMRoom = findDirectRoomWithUser((item as ChatUser)._id);
    }

    return (
      <Flex align="center" gap="sm" style={{ width: '100%' }}>
        <Avatar src={isRoom ? (item as ChatRoom).displayAvatar || undefined : (item as ChatUser).profileImage || (item as ChatUser).avatar || undefined} size="sm">
          {icon}
        </Avatar>
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="xs">
            <Typography variant="body-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isRoom ? (item as ChatRoom).name || (item as ChatRoom).displayName : (item as ChatUser).username}
            </Typography>
            {isUser && !existingDMRoom && (
              <span style={{ 
                fontSize: '10px', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                backgroundColor: 'var(--color-primary-main)', 
                color: 'white',
                fontWeight: 'bold'
              }}>
                생성
              </span>
            )}
          </Flex>
          <Typography variant="caption" color="text-secondary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isRoom 
              ? `유형: ${(item as ChatRoom).type}` 
              : existingDMRoom 
                ? `DM: ${existingDMRoom.displayName || existingDMRoom.name || '다이렉트 메시지'}` 
                : ((item as ChatUser).email || '다이렉트 메시지 생성')}
          </Typography>
        </Flex>
      </Flex>
    );
  };

  return (
    <Stack spacing="sm">
      <Autocomplete<CombinedItem>
        options={options}
        value={selectedTarget ? { ...selectedTarget, __type: (selectedTarget as any).username ? 'user' : 'room' } : undefined}
        onChange={(newValue) => {
          onTargetChange(newValue as CombinedItem | null);
        }}
        filterOptions={filterOptions}
        renderOption={renderOption}
        placeholder={placeholder}
        label={label}
        helperText={helperText}
        error={error}
        disabled={disabled}
        fullWidth={fullWidth}
        openOnFocus
        autoHighlight
        clearOnEscape
      />
    </Stack>
  );
}
