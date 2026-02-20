import { JSX } from 'preact';
import { Paper } from '@/components/ui/paper';
import { Box } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import './AuthLayout.scss';

interface AuthLayoutProps {
  children: JSX.Element | JSX.Element[];
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Box className="auth-layout">
      <div className="auth-layout__container">
        <Paper className="auth-layout__card" elevation={3} padding="xl">
          <div className="auth-layout__header">
            <Typography variant="h2" className="auth-layout__title">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body-medium" className="auth-layout__subtitle">
                {subtitle}
              </Typography>
            )}
          </div>
          <div className="auth-layout__content">
            {children}
          </div>
        </Paper>
      </div>
    </Box>
  );
}
