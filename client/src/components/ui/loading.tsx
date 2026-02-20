import * as React from "react"
import { Rocket as IconRocket } from "lucide-preact"
import { cn } from "@/lib/utils"

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export function Loading({ size = 'medium', fullScreen = false, className, ...props }: LoadingProps) {
  const iconSize = size === 'small' ? 24 : size === 'large' ? 48 : 36;

  return (
    <div
      className={cn(
        "flex items-center justify-center text-primary",
        fullScreen && "fixed inset-0 bg-background z-[1300]",
        className
      )}
      role="status"
      aria-label="로딩 중"
      {...props}
    >
      <div className="relative w-[200px] h-[200px] flex flex-col items-center justify-center overflow-hidden">
        {/* 우주 먼지/속도감 효과 */}
        <div className="absolute inset-0 z-0">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "absolute bg-border rounded-full opacity-30 h-[2px]",
                `loading-particle-${i}`
              )} 
            />
          ))}
        </div>

        {/* 로켓 본체 */}
        <div className="relative rotate-[45deg] animate-[rocket-float_2s_infinite_ease-in-out]">
          <div className="z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.4)] animate-[rocket-shake_0.1s_infinite_alternate]">
            <IconRocket size={iconSize} strokeWidth={1.5} />
          </div>
          
          {/* 로켓 화염/연기 */}
          <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-2 h-5 bg-gradient-to-b from-[#ff9d00] to-[#ff4d00] rounded-[50%_50%_20%_20%] blur-[1px] animate-[flame-pulse_0.2s_infinite_alternate]" />
          </div>
        </div>

        {/* 텍스트 */}
        <div className="mt-6 text-sm font-semibold text-muted-foreground tracking-widest animate-pulse">
          이동 중...
        </div>

        <style>{`
          @keyframes rocket-float {
            0%, 100% { transform: rotate(45deg) translate(0, 0); }
            50% { transform: rotate(45deg) translate(5px, -5px); }
          }
          @keyframes rocket-shake {
            from { transform: translate(-1px, 0); }
            to { transform: translate(1px, 0.5px); }
          }
          @keyframes flame-pulse {
            from { height: 15px; opacity: 0.8; transform: scaleX(1); }
            to { height: 25px; opacity: 1; transform: scaleX(1.2); }
          }
          @keyframes particle-zoom {
            from { transform: translateX(0) rotate(-45deg); opacity: 0; }
            50% { opacity: 0.4; }
            to { transform: translateX(-300px) rotate(-45deg); opacity: 0; }
          }
          ${[...Array(6)].map((_, i) => `
            .loading-particle-${i} {
              width: ${Math.random() * 20 + 10}px;
              top: ${Math.random() * 100}%;
              left: 120%;
              animation: particle-zoom ${Math.random() * 0.5 + 0.5}s infinite linear;
              animation-delay: ${i * 0.2}s;
            }
          `).join('')}
        `}</style>
      </div>
    </div>
  );
}

export interface DotsLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
}

export function DotsLoading({ className, color, style, ...props }: DotsLoadingProps) {
  return (
    <div 
      className={cn("flex items-center justify-center gap-1", className)} 
      style={{ color, ...style }}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
    </div>
  )
}
