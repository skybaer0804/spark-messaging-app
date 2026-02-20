import { JSX } from 'preact';
import { cn } from '@/lib/utils';
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardContent,
  CardFooter as ShadcnCardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: preact.ComponentChildren;
}

export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <ShadcnCard
      className={cn(interactive && 'hover:shadow-md cursor-pointer transition-shadow', className)}
      {...(props as JSX.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </ShadcnCard>
  );
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: preact.ComponentChildren;
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <ShadcnCardHeader
      className={className}
      {...(props as JSX.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </ShadcnCardHeader>
  );
}

export interface CardBodyProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: preact.ComponentChildren;
}

export function CardBody({ className = '', children, ...props }: CardBodyProps) {
  return (
    <CardContent
      className={className}
      {...(props as JSX.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </CardContent>
  );
}

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: preact.ComponentChildren;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <ShadcnCardFooter
      className={className}
      {...(props as JSX.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </ShadcnCardFooter>
  );
}

export { CardTitle, CardDescription };
