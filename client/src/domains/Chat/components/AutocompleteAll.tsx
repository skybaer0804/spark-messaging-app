import { useMemo } from 'preact/hooks';
import { Autocomplete, AutocompleteOption } from '@/ui-components/Autocomplete/Autocomplete';
import { Stack } from '@/ui-components/Layout/Stack';
import { ProfileItem } from './ProfileItem/ProfileItem';
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
      .filter((r) => r._id !== excludeRoomId && ['public', 'team'].includes(r.type))
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

  // 옵션 렌더링
  const renderOption = (option: AutocompleteOption<CombinedItem>) => {
    const item = option.value;
    const isRoom = item.__type === 'room';
    const isUser = item.__type === 'user';

    let existingDMRoom: ChatRoom | null = null;
    if (isUser) {
      existingDMRoom = findDirectRoomWithUser((item as ChatUser)._id);
    }

    const name = isRoom 
      ? (item as ChatRoom).name || (item as ChatRoom).displayName 
      : (item as ChatUser).username;
    
    const desc = isRoom 
      ? `유형: ${(item as ChatRoom).type}` 
      : existingDMRoom 
        ? `DM: ${existingDMRoom.displayName || existingDMRoom.name || '다이렉트 메시지'}` 
        : ((item as ChatUser).email || '다이렉트 메시지 생성');

    return (
      <ProfileItem
        name={name || '이름 없음'}
        desc={desc}
        type={isRoom ? (item as ChatRoom).type : 'direct'}
        isPrivate={isRoom ? ((item as ChatRoom).isPrivate || (item as any).private) : false}
        avatar={isRoom ? (item as ChatRoom).displayAvatar || undefined : (item as ChatUser).profileImage || (item as ChatUser).avatar || undefined}
        status={isUser ? (item as ChatUser).status : undefined}
        styleOption={{
          mode: 'list',
          statusPosition: isUser ? 'name-left' : undefined,
          noHover: true,
          nameSuffix: isUser && !existingDMRoom ? (
            <span style={{ 
              fontSize: '10px', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--color-interactive-primary)', 
              color: 'white',
              fontWeight: 'bold',
              marginLeft: '4px'
            }}>
              생성
            </span>
          ) : undefined
        }}
        style={{ width: '100%', margin: 0, padding: '4px 8px' }}
      />
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
