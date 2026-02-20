import { useState, useEffect } from 'preact/hooks';
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '@/core/utils/storageCache';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { useRouterState } from '@/routes/RouterState';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CircularProgress } from '@/components/ui/circular-progress';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { IconEye, IconEyeOff, IconMail, IconLock } from '@tabler/icons-preact';
import './Login.scss';

export function Login() {
  const [email, setEmail] = useState('test@naver.com');
  const [password, setPassword] = useState('test2026,.');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, loading } = useAuth();
  const { showError } = useToast();
  const { navigate } = useRouterState();

  useEffect(() => {
    const savedEmail = getLocalStorage('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      await signIn({ email, password });

      if (rememberMe) {
        setLocalStorage('saved_email', email);
      } else {
        removeLocalStorage('saved_email');
      }

      navigate('/chatapp');
    } catch (error: any) {
      console.error('로그인 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      showError(errorMessage);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AuthLayout title="환영합니다!" subtitle="계정에 로그인하여 시작하세요.">
      <form onSubmit={handleSubmit} className="login-form space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일 주소</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <IconMail size={20} />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onInput={(e: any) => setEmail(e.target.value)}
              placeholder="example@spark.com"
              required
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <IconLock size={20} />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onInput={(e: any) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="pl-10 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Checkbox label="아이디 저장" checked={rememberMe} onChange={(checked) => setRememberMe(checked)} />
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-normal">
            비밀번호를 잊으셨나요?
          </Button>
        </div>

        <Button type="submit" variant="default" className="w-full" disabled={loading}>
          <div className="flex items-center justify-center gap-2">
            <span>{loading ? '로그인 중...' : '로그인'}</span>
            {loading && <CircularProgress size={18} color="inherit" />}
          </div>
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
          <span>계정이 없으신가요?</span>
          <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => navigate('/signup')}>
            회원가입
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
