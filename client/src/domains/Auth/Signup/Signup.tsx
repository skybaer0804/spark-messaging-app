import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { useRouterState } from '@/routes/RouterState';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { Grid } from '@/components/ui/layout';
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
    className={`signup-form__validation-badge ${isValid ? 'is-valid' : ''}`} 
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
      <form onSubmit={handleSubmit} className="signup-form">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">사용자 이름</label>
              <ValidationBadge isValid={debouncedStatus.username} />
            </div>
            <TextField
              name="username"
              value={formData.username}
              onInput={handleInputChange}
              placeholder="영어, 한글, 숫자 허용 3자 이상"
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
              startAdornment={<IconUser size={20} />}
            />
          </Grid>

          <Grid item xs={12}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">이메일 주소</label>
              <ValidationBadge isValid={debouncedStatus.email} />
            </div>
            <TextField
              name="email"
              type="email"
              value={formData.email}
              onInput={handleInputChange}
              placeholder="example@spark.com"
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
              startAdornment={<IconMail size={20} />}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">비밀번호</label>
              <ValidationBadge isValid={debouncedStatus.password} />
            </div>
            <TextField
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onInput={handleInputChange}
              placeholder="영문/숫자/특수문자 2종 이상(10자+) 또는 3종 이상(8자+)"
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              startAdornment={
                <div onClick={togglePasswordVisibility} className="signup-form__icon-toggle" title="비밀번호 보기/숨기기">
                  <IconLock size={20} color={debouncedStatus.password ? 'var(--color-status-success)' : 'currentColor'} />
                </div>
              }
              endAdornment={
                <div onClick={togglePasswordVisibility} className="signup-form__icon-toggle">
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </div>
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">비밀번호 확인</label>
              <ValidationBadge isValid={debouncedStatus.confirmPassword} />
            </div>
            <TextField
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onInput={handleInputChange}
              placeholder="다시 입력"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              fullWidth
              startAdornment={
                <div onClick={toggleConfirmPasswordVisibility} className="signup-form__icon-toggle" title="비밀번호 보기/숨기기">
                  <IconLock size={20} color={debouncedStatus.confirmPassword ? 'var(--color-status-success)' : 'currentColor'} />
                </div>
              }
              endAdornment={
                <div onClick={toggleConfirmPasswordVisibility} className="signup-form__icon-toggle">
                  {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </div>
              }
            />
          </Grid>

          <Grid item xs={12}>
            <p className="signup-form__password-hint">
              비밀번호는 연속적인 숫자나 생일, 전화번호 등 추측하기 쉬운 개인정보 및 아이디와 비슷한 비밀번호는 사용하지 마세요.
            </p>
          </Grid>

          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              disabled={loading}
              className="signup-form__submit"
            >
              {loading ? '처리 중...' : '회원가입 완료'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <div className="signup-form__footer">
              <span>이미 계정이 있으신가요?</span>
              <Button variant="text" onClick={() => navigate('/login')}>
                로그인
              </Button>
            </div>
          </Grid>
        </Grid>
      </form>
    </AuthLayout>
  );
}
