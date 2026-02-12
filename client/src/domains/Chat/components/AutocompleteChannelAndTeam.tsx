import { useMemo } from 'preact/hooks';
import { Autocomplete, AutocompleteOption } from '@/ui-components/Autocomplete/Autocomplete';
import { Stack } from '@/ui-components/Layout/Stack';
import { ProfileItem } from './ProfileItem/ProfileItem';
import type { ChatRoom } from '../types';

export interface AutocompleteChannelAndTeamProps {
  roomList: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onRoomChange: (room: ChatRoom | null) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  isValid?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function AutocompleteChannelAndTeam({
  roomList,
  selectedRoom,
  onRoomChange,
  placeholder = '채널 또는 그룹 선택',
  label = '상위 채널 또는 그룹',
  helperText,
  error = false,
  isValid = false,
  disabled = false,
  fullWidth = true,
}: AutocompleteChannelAndTeamProps) {
  // 토론의 부모가 될 수 있는 룸 목록 (공개 채널, 비공개 채널, 팀)
  const filteredRoomList = useMemo(() => {
    return roomList.filter((room) => ['public', 'team'].includes(room.type));
  }, [roomList]);

  // Autocomplete 옵션으로 변환
  const options: AutocompleteOption<ChatRoom>[] = useMemo(() => {
    return filteredRoomList.map((room) => ({
      label: room.name || room.displayName || '이름 없음',
      value: room,
    }));
  }, [filteredRoomList]);

  // 옵션 필터링
  const filterOptions = (options: AutocompleteOption<ChatRoom>[], inputValue: string): AutocompleteOption<ChatRoom>[] => {
    if (!inputValue.trim()) {
      return options;
    }

    const lowerInput = inputValue.toLowerCase();
    return options.filter((option) => {
      const room = option.value;
      const roomName = (room.name || room.displayName || '').toLowerCase();
      return roomName.includes(lowerInput);
    });
  };

  // 옵션 렌더링
  const renderOption = (option: AutocompleteOption<ChatRoom>) => {
    const room = option.value;

    return (
      <ProfileItem
        name={room.name || room.displayName || '이름 없음'}
        desc={room.description}
        type={room.type}
        isPrivate={room.isPrivate || room.private}
        avatar={room.displayAvatar || undefined}
        styleOption={{
          mode: 'list',
          statusPosition: 'none' as any,
          noHover: true,
        }}
        style={{ width: '100%', margin: 0, padding: '4px 8px' }}
      />
    );
  };

  return (
    <Stack spacing="sm">
      <Autocomplete<ChatRoom>
        options={options}
        value={selectedRoom || undefined}
        onChange={(newValue) => {
          onRoomChange(newValue as ChatRoom | null);
        }}
        filterOptions={filterOptions}
        renderOption={renderOption}
        placeholder={placeholder}
        label={label}
        helperText={helperText}
        error={error}
        isValid={isValid || !!selectedRoom}
        disabled={disabled}
        fullWidth={fullWidth}
        openOnFocus
        autoHighlight
        clearOnEscape
      />
    </Stack>
  );
}
