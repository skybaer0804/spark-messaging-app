import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { useRouterState } from '@/routes/RouterState';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { IconCircleCheckFilled, IconUser, IconMail, IconLock, IconEye, IconEyeOff } from '@tabler/icons-preact';
import './Signup.scss';

// Regex constants
const USERNAME_REGEX = /^[a-zA-Z가-힣0-9]{3,}$/;
const EMAIL_REGEX = /\S+@\S+\.\S+/;

const isPasswordValid = (password: string) => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const typeCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  
  return (typeCount >= 3 && password.length >= 8) || (typeCount >= 2 && password.length >= 10);
};

interface ValidationBadgeProps {
  isValid: boolean;
}

const ValidationBadge = memo(({ isValid }: ValidationBadgeProps) => (
  <span 
    className={cn(
      "inline-flex items-center ml-1 transition-colors",
      isValid ? "text-success" : "text-muted-foreground/30"
    )}
    title={isValid ? '입력 완료' : '필수 입력 항목'}
  >
    <IconCircleCheckFilled size={14} />
  </span>
));

export function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [debouncedStatus, setDebouncedStatus] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const { navigate } = useRouterState();

  const validationStatus = useMemo(() => ({
    username: USERNAME_REGEX.test(formData.username),
    email: EMAIL_REGEX.test(formData.email),
    password: isPasswordValid(formData.password),
    confirmPassword: formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password,
  }), [formData]);

  // 모든 필드 데바운싱 검증 (0.5초)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStatus(validationStatus);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        
        // 사용자 이름 에러 업데이트
        if (formData.username && !validationStatus.username) {
          newErrors.username = '사용자 이름은 영문, 한글, 숫자 허용 3자 이상이어야 합니다.';
        } else {
          delete newErrors.username;
        }

        // 이메일 에러 업데이트
        if (formData.email && !validationStatus.email) {
          newErrors.email = '유효한 이메일 형식이 아닙니다.';
        } else {
          delete newErrors.email;
        }

        // 비밀번호 에러 업데이트
        if (formData.password && !validationStatus.password) {
          newErrors.password = '영문, 숫자, 특수문자 중 2종류 이상 조합 시 10자 이상, 3종류 이상 조합 시 8자 이상이어야 합니다.';
        } else {
          delete newErrors.password;
        }

        // 비밀번호 확인 에러 업데이트
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        } else {
          delete newErrors.confirmPassword;
        }

        return newErrors;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, validationStatus]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);
  const toggleConfirmPasswordVisibility = useCallback(() => setShowConfirmPassword(prev => !prev), []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!validationStatus.username) newErrors.username = '사용자 이름은 영문, 한글, 숫자 허용 3자 이상이어야 합니다.';
    if (!formData.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!validationStatus.email) newErrors.email = '유효한 이메일 형식이 아닙니다.';
    
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (!validationStatus.password) newErrors.password = '영문, 숫자, 특수문자 중 2종류 이상 조합 시 10자 이상, 3종류 이상 조합 시 8자 이상이어야 합니다.';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await signUp({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      showSuccess('회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      const errorMessage = error.response?.data?.message || error.message || '';
      
      if (errorMessage.includes('email')) {
        setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
      } else if (errorMessage.includes('Username')) {
        setErrors(prev => ({ ...prev, username: '이미 사용 중인 사용자 이름입니다.' }));
      } else {
        showError(errorMessage || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <AuthLayout title="계정 만들기" subtitle="Spark Messaging의 회원이 되어보세요.">
      <form onSubmit={handleSubmit} className="signup-form space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="username" className="flex items-center">
              사용자 이름
              <ValidationBadge isValid={debouncedStatus.username} />
            </Label>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <IconUser size={20} />
            </div>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onInput={handleInputChange}
              placeholder="영어, 한글, 숫자 허용 3자 이상"
              className={cn("pl-10", errors.username && "border-destructive")}
            />
          </div>
          {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="flex items-center">
              이메일 주소
              <ValidationBadge isValid={debouncedStatus.email} />
            </Label>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <IconMail size={20} />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onInput={handleInputChange}
              placeholder="example@spark.com"
              className={cn("pl-10", errors.email && "border-destructive")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center">
                비밀번호
                <ValidationBadge isValid={debouncedStatus.password} />
              </Label>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IconLock size={20} className={cn(debouncedStatus.password && "text-success")} />
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onInput={handleInputChange}
                placeholder="영문/숫자/특수문자 조합"
                className={cn("pl-10 pr-10", errors.password && "border-destructive")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmPassword" className="flex items-center">
                비밀번호 확인
                <ValidationBadge isValid={debouncedStatus.confirmPassword} />
              </Label>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IconLock size={20} className={cn(debouncedStatus.confirmPassword && "text-success")} />
              </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onInput={handleInputChange}
                placeholder="다시 입력"
                className={cn("pl-10 pr-10", errors.confirmPassword && "border-destructive")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>
        </div>
        
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        {errors.confirmPassword && !errors.password && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}

        <p className="text-xs text-muted-foreground opacity-70 py-2">
          비밀번호는 연속적인 숫자나 생일, 전화번호 등 추측하기 쉬운 개인정보 및 아이디와 비슷한 비밀번호는 사용하지 마세요.
        </p>

        <Button 
          type="submit" 
          variant="default" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? '처리 중...' : '회원가입 완료'}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
          <span>이미 계정이 있으신가요?</span>
          <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => navigate('/login')}>
            로그인
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
