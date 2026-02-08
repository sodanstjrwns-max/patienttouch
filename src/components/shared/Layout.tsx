import { FC } from 'hono/jsx'

// ============================================
// Premium Design System - Shared Components
// ============================================

interface LayoutProps {
  children: any
  activeTab?: 'home' | 'consultations' | 'patients' | 'report'
  hideNav?: boolean
}

export const Layout: FC<LayoutProps> = ({ children, activeTab, hideNav }) => {
  const tabs = [
    { id: 'home', href: '/', icon: 'fas fa-house', label: '홈' },
    { id: 'consultations', href: '/consultations', icon: 'fas fa-waveform-lines', label: '상담' },
    { id: 'patients', href: '/patients', icon: 'fas fa-user-group', label: '환자' },
    { id: 'report', href: '/report', icon: 'fas fa-chart-mixed', label: '리포트' },
  ]

  return (
    <div class="min-h-screen pb-24">
      <main class="max-w-lg mx-auto relative">
        {children}
      </main>

      {!hideNav && (
        <nav class="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
          <div class="max-w-lg mx-auto px-4 pb-1">
            <div class="glass rounded-2xl shadow-float border border-white/60 px-2 py-1">
              <div class="flex justify-around items-center">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <a 
                      href={tab.href}
                      class={`relative flex flex-col items-center py-2.5 px-5 rounded-xl transition-all duration-300 group ${
                        isActive 
                          ? 'text-brand-600' 
                          : 'text-surface-400 hover:text-surface-600'
                      }`}
                    >
                      {isActive && (
                        <div class="absolute inset-0 bg-brand-50 rounded-xl" />
                      )}
                      <i class={`${tab.icon} text-lg relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}></i>
                      <span class={`text-[10px] mt-1 font-semibold relative z-10 tracking-tight ${isActive ? 'text-brand-700' : ''}`}>{tab.label}</span>
                      {isActive && (
                        <div class="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-500 rounded-full" />
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backUrl?: string
  rightAction?: any
  transparent?: boolean
}

export const Header: FC<HeaderProps> = ({ title, subtitle, showBack, backUrl, rightAction, transparent }) => {
  return (
    <header class={`sticky top-0 z-40 transition-all duration-300 ${transparent ? '' : 'glass border-b border-surface-200/50'}`}>
      <div class="flex items-center justify-between px-4 py-3 safe-area-top">
        <div class="flex items-center gap-3 min-w-0">
          {showBack && (
            <a 
              href={backUrl || 'javascript:history.back()'} 
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-600 transition-all duration-200 active:scale-95 shrink-0"
            >
              <i class="fas fa-chevron-left text-sm"></i>
            </a>
          )}
          <div class="min-w-0">
            <h1 class="text-lg font-bold tracking-tight truncate">{title}</h1>
            {subtitle && <p class="text-xs text-surface-500 truncate">{subtitle}</p>}
          </div>
        </div>
        {rightAction && <div class="shrink-0 ml-3">{rightAction}</div>}
      </div>
    </header>
  )
}

// ============================================
// Card Component
// ============================================

interface CardProps {
  children: any
  className?: string
  hover?: boolean
  glow?: boolean
  onClick?: string
}

export const Card: FC<CardProps> = ({ children, className, hover = true, glow, onClick }) => {
  return (
    <div 
      class={`card-premium ${hover ? '' : '!shadow-card !hover:shadow-card !hover:transform-none'} ${glow ? 'ring-1 ring-brand-200 shadow-glow' : ''} ${className || ''}`}
      onclick={onClick}
    >
      {children}
    </div>
  )
}

// ============================================
// Badge Component
// ============================================

interface BadgeProps {
  children: any
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'ghost'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
  icon?: string
}

export const Badge: FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', dot, pulse, icon }) => {
  const variants: Record<string, string> = {
    default: 'bg-surface-100 text-surface-700 ring-surface-200/50',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200/50',
    danger: 'bg-rose-50 text-rose-700 ring-rose-200/50',
    info: 'bg-sky-50 text-sky-700 ring-sky-200/50',
    brand: 'bg-brand-50 text-brand-700 ring-brand-200/50',
    ghost: 'bg-transparent text-surface-500',
  }
  const sizes: Record<string, string> = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span class={`inline-flex items-center gap-1 font-semibold rounded-lg ring-1 ring-inset ${variants[variant]} ${sizes[size]}`}>
      {dot && (
        <span class={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'danger' ? 'bg-rose-500' :
          variant === 'info' ? 'bg-sky-500' :
          variant === 'brand' ? 'bg-brand-500' :
          'bg-surface-400'
        } ${pulse ? 'animate-pulse-soft' : ''}`} />
      )}
      {icon && <i class={`${icon} text-[10px]`}></i>}
      {children}
    </span>
  )
}

// ============================================
// Button Component
// ============================================

interface ButtonProps {
  children: any
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand-gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  href?: string
  onClick?: string
  type?: string
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconRight?: string
  fullWidth?: boolean
}

export const Button: FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className, href, onClick, 
  type, disabled, loading, icon, iconRight, fullWidth 
}) => {
  const variants: Record<string, string> = {
    'primary': 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-600/30 active:shadow-sm',
    'secondary': 'bg-surface-100 hover:bg-surface-200 text-surface-800',
    'outline': 'border-2 border-surface-200 hover:border-surface-300 hover:bg-surface-50 text-surface-700',
    'ghost': 'hover:bg-surface-100 text-surface-600',
    'danger': 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20',
    'brand-gradient': 'bg-gradient-brand text-white shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 btn-glow',
  }
  const sizes: Record<string, string> = {
    xs: 'px-2.5 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-2.5',
  }
  
  const baseClass = `inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${fullWidth ? 'w-full' : ''} ${className || ''}`
  
  const content = (
    <>
      {loading ? <i class="fas fa-spinner-third fa-spin text-sm"></i> : icon && <i class={`${icon} ${size === 'xs' ? 'text-[10px]' : 'text-sm'}`}></i>}
      <span>{children}</span>
      {iconRight && <i class={`${iconRight} ${size === 'xs' ? 'text-[10px]' : 'text-sm'}`}></i>}
    </>
  )
  
  if (href) {
    return <a href={href} class={baseClass}>{content}</a>
  }
  return (
    <button type={(type as any) || 'button'} class={baseClass} onclick={onClick} disabled={disabled}>
      {content}
    </button>
  )
}

// ============================================
// Stat Card (KPI)
// ============================================

interface StatCardProps {
  label: string
  value: string
  change?: number
  icon: string
  iconColor?: string
  goal?: number
  unit?: string
}

export const StatCard: FC<StatCardProps> = ({ label, value, change, icon, iconColor = 'text-brand-600 bg-brand-50', goal, unit }) => {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div class="card-premium p-4 group">
      <div class="flex items-start justify-between mb-3">
        <div class={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
          <i class={`${icon} text-base`}></i>
        </div>
        {change !== undefined && (
          <span class={`text-xs font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
            isPositive ? 'text-emerald-700 bg-emerald-50' : 
            isNegative ? 'text-rose-700 bg-rose-50' : 
            'text-surface-500 bg-surface-50'
          }`}>
            <i class={`fas fa-arrow-${isPositive ? 'up' : isNegative ? 'down' : 'right'} text-[9px]`}></i>
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div class="text-2xl font-extrabold tracking-tight text-surface-900">{value}<span class="text-sm font-medium text-surface-400 ml-0.5">{unit}</span></div>
      <div class="text-xs font-medium text-surface-500 mt-0.5">{label}</div>
      {goal !== undefined && (
        <div class="mt-3">
          <div class="flex justify-between text-[10px] font-medium text-surface-400 mb-1">
            <span>목표 달성률</span>
            <span class="text-surface-600">{Math.min(100, Math.round((parseFloat(value) / goal) * 100))}%</span>
          </div>
          <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000 ease-out"
              style={`width: ${Math.min(100, (parseFloat(value) / goal) * 100)}%`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Empty State
// ============================================

export const EmptyState: FC<{ icon: string; title: string; description?: string; action?: any }> = 
  ({ icon, title, description, action }) => {
  return (
    <div class="text-center py-16 px-6 animate-fade-in">
      <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center">
        <i class={`${icon} text-3xl text-surface-300`}></i>
      </div>
      <h3 class="text-lg font-bold text-surface-800 mb-1">{title}</h3>
      {description && <p class="text-surface-500 text-sm mb-5 max-w-xs mx-auto leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

// ============================================
// Progress Bar
// ============================================

export const ProgressBar: FC<{ value: number; max?: number; color?: string; showLabel?: boolean; size?: 'sm' | 'md' | 'lg' }> = 
  ({ value, max = 100, color = 'brand', showLabel, size = 'md' }) => {
  const percent = Math.min(100, Math.round((value / max) * 100))
  const colors: Record<string, string> = {
    brand: 'from-brand-500 to-brand-400',
    emerald: 'from-emerald-500 to-emerald-400',
    amber: 'from-amber-500 to-amber-400',
    rose: 'from-rose-500 to-rose-400',
    sky: 'from-sky-500 to-sky-400',
  }
  const heights: Record<string, string> = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2.5',
  }
  return (
    <div class="w-full">
      <div class={`w-full bg-surface-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div 
          class={`h-full bg-gradient-to-r ${colors[color] || colors.brand} rounded-full transition-all duration-1000 ease-out`} 
          style={`width: ${percent}%`}
        />
      </div>
      {showLabel && (
        <div class="text-right text-[10px] font-semibold text-surface-400 mt-1">{percent}%</div>
      )}
    </div>
  )
}

// ============================================
// Avatar
// ============================================

export const Avatar: FC<{ name: string; size?: 'sm' | 'md' | 'lg'; src?: string }> = 
  ({ name, size = 'md', src }) => {
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }
  const colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700']
  const colorIdx = name.charCodeAt(0) % colors.length

  if (src) {
    return <img src={src} alt={name} class={`${sizes[size]} rounded-xl object-cover`} />
  }

  return (
    <div class={`${sizes[size]} ${colors[colorIdx]} rounded-xl flex items-center justify-center font-bold shrink-0`}>
      {name.charAt(0)}
    </div>
  )
}

// ============================================
// Skeleton Loader
// ============================================

export const Skeleton: FC<{ lines?: number; type?: 'text' | 'card' | 'avatar' }> = ({ lines = 3, type = 'text' }) => {
  if (type === 'avatar') {
    return <div class="w-10 h-10 rounded-xl shimmer" />
  }
  if (type === 'card') {
    return (
      <div class="card-premium p-5 space-y-3">
        <div class="h-4 shimmer rounded-lg w-2/3" />
        <div class="h-3 shimmer rounded-lg w-full" />
        <div class="h-3 shimmer rounded-lg w-4/5" />
      </div>
    )
  }
  return (
    <div class="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div class={`h-3 shimmer rounded-lg`} style={`width: ${85 - i * 15}%`} />
      ))}
    </div>
  )
}

// ============================================
// Section Title
// ============================================

export const SectionTitle: FC<{ title: string; subtitle?: string; action?: any; icon?: string }> = 
  ({ title, subtitle, action, icon }) => {
  return (
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        {icon && (
          <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
            <i class={`${icon} text-xs text-brand-600`}></i>
          </div>
        )}
        <div>
          <h2 class="text-base font-bold text-surface-900">{title}</h2>
          {subtitle && <p class="text-xs text-surface-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ============================================
// Divider
// ============================================

export const Divider: FC<{ label?: string }> = ({ label }) => {
  if (label) {
    return (
      <div class="flex items-center gap-3 my-4">
        <div class="flex-1 h-px bg-surface-200" />
        <span class="text-xs font-medium text-surface-400">{label}</span>
        <div class="flex-1 h-px bg-surface-200" />
      </div>
    )
  }
  return <div class="h-px bg-surface-100 my-4" />
}
