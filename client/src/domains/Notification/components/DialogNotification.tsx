import { useTheme } from '@/core/context/ThemeProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IconSend, IconX, IconCircleCheckFilled } from '@tabler/icons-preact';
import type { Workspace } from '../../Chat/types/ChatRoom';
import { cn } from '@/lib/utils';

interface DialogNotificationProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'view' | 'edit';
  title: string;
  setTitle: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  scheduledDate: string;
  setScheduledAt: (value: string) => void;
  isImmediateSend: boolean;
  setIsImmediateSend: (value: boolean) => void;
  targetType: 'all' | 'workspace';
  setTargetType: (value: 'all' | 'workspace') => void;
  targetId: string;
  setTargetId: (value: string) => void;
  workspaceList: Workspace[];
  isConnected: boolean;
  handleSend: () => Promise<void>;
}

export function DialogNotification({
  open,
  onClose,
  mode,
  title,
  setTitle,
  message,
  setMessage,
  scheduledDate,
  setScheduledAt,
  isImmediateSend,
  setIsImmediateSend,
  targetType,
  setTargetType,
  targetId,
  setTargetId,
  workspaceList,
  isConnected,
  handleSend,
}: DialogNotificationProps) {
  const { deviceSize } = useTheme();
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isReadOnly = isViewMode;

  // 알림 제목 유효성 검사 (Injection 방어 포함)
  const isValidTitle = (val: string) => {
    if (!val.trim()) return false;
    // 제목에는 일부 특수문자 허용하되 Injection 방어 (< > / \ & 제한)
    return /^[^<>/\\&]*$/.test(val);
  };

  // 알림 메시지 유효성 검사 (Injection 방어)
  const isValidMessage = (val: string) => {
    if (!val.trim()) return false;
    return /^[^<>/\\&]*$/.test(val);
  };

  // 대상 정보 유효성 검사
  const isValidTarget = targetType === 'all' || (targetType === 'workspace' && !!targetId);

  // 일정 정보 유효성 검사
  const isValidSchedule = isImmediateSend || !!scheduledDate;

  const isFormValid = isValidTitle(title) && isValidMessage(message) && isValidTarget && isValidSchedule && isConnected;

  const getDialogTitle = () => {
    if (isEditMode) return '시스템 알림 수정';
    if (isViewMode) return '알림 상세 정보';
    return '새 시스템 알림 생성';
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            시스템 전체 또는 특정 워크스페이스 사용자에게 알림을 보냅니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notification-title">알림 제목</Label>
            <Input
              id="notification-title"
              value={title}
              onInput={(e: any) => setTitle(e.currentTarget.value)}
              placeholder="알림 제목을 입력하세요..."
              disabled={isReadOnly}
              className={cn(!isReadOnly && title.length > 0 && !isValidTitle(title) && "border-destructive")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notification-message">메시지 내용</Label>
            <textarea
              id="notification-message"
              value={message}
              onInput={(e: any) => setMessage(e.currentTarget.value)}
              placeholder="알림 메시지를 입력하세요..."
              disabled={isReadOnly}
              rows={6}
              className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                !isReadOnly && message.length > 0 && !isValidMessage(message) && "border-destructive"
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>대상 유형</Label>
            <Select
              value={targetType}
              onValueChange={(value: any) => setTargetType(value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 사용자</SelectItem>
                <SelectItem value="workspace">특정 워크스페이스</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === 'workspace' && (
            <div className="grid gap-2">
              <Label>워크스페이스 선택</Label>
              <Select
                value={targetId}
                onValueChange={setTargetId}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="워크스페이스를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {workspaceList.map((ws) => (
                    <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4">
            <Label className="flex items-center gap-2">
              {isReadOnly ? '전송 일시' : '전송 일정'}
              {!isReadOnly && (
                <IconCircleCheckFilled 
                  size={14} 
                  className={cn(isValidSchedule ? "text-success" : "text-muted-foreground/30")} 
                />
              )}
            </Label>

            <div className="flex gap-4 items-center">
              {isReadOnly ? (
                <Input
                  value={
                    scheduledDate
                      ? new Intl.DateTimeFormat('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        }).format(new Date(scheduledDate))
                      : '-'
                  }
                  disabled
                />
              ) : (
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e: any) => setScheduledAt(e.currentTarget.value)}
                  disabled={isImmediateSend}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    isImmediateSend && "bg-muted"
                  )}
                />
              )}
            </div>

            {!isReadOnly && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>즉시 발송</Label>
                  <p className="text-xs text-muted-foreground">
                    알림을 즉시 발송합니다. 비활성화 시 위에서 예약 일시를 선택할 수 있습니다.
                  </p>
                </div>
                <Switch
                  checked={isImmediateSend}
                  onCheckedChange={setIsImmediateSend}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <IconX size={18} className="mr-2" />
            {isViewMode ? '닫기' : '취소'}
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleSend}
              disabled={!isFormValid}
            >
              <IconSend size={18} className="mr-2" />
              {isEditMode ? '수정 저장' : '알림 보내기'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
