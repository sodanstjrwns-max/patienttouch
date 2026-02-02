import { FC } from 'hono/jsx'

interface LayoutProps {
  children: any
  activeTab?: 'home' | 'consultations' | 'patients' | 'report'
  hideNav?: boolean
}

export const Layout: FC<LayoutProps> = ({ children, activeTab, hideNav }) => {
  return (
    <div class="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <main class="max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
          <div class="max-w-lg mx-auto flex justify-around py-2">
            <a href="/" class={`flex flex-col items-center py-2 px-4 ${activeTab === 'home' ? 'text-primary-600' : 'text-gray-500'}`}>
              <i class="fas fa-home text-xl"></i>
              <span class="text-xs mt-1">홈</span>
            </a>
            <a href="/consultations" class={`flex flex-col items-center py-2 px-4 ${activeTab === 'consultations' ? 'text-primary-600' : 'text-gray-500'}`}>
              <i class="fas fa-microphone text-xl"></i>
              <span class="text-xs mt-1">상담</span>
            </a>
            <a href="/patients" class={`flex flex-col items-center py-2 px-4 ${activeTab === 'patients' ? 'text-primary-600' : 'text-gray-500'}`}>
              <i class="fas fa-users text-xl"></i>
              <span class="text-xs mt-1">환자</span>
            </a>
            <a href="/report" class={`flex flex-col items-center py-2 px-4 ${activeTab === 'report' ? 'text-primary-600' : 'text-gray-500'}`}>
              <i class="fas fa-chart-line text-xl"></i>
              <span class="text-xs mt-1">리포트</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  )
}

interface HeaderProps {
  title: string
  showBack?: boolean
  backUrl?: string
  rightAction?: any
}

export const Header: FC<HeaderProps> = ({ title, showBack, backUrl, rightAction }) => {
  return (
    <header class="sticky top-0 bg-white border-b border-gray-200 z-40">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          {showBack && (
            <a href={backUrl || 'javascript:history.back()'} class="text-gray-600 hover:text-gray-900">
              <i class="fas fa-arrow-left text-lg"></i>
            </a>
          )}
          <h1 class="text-lg font-semibold">{title}</h1>
        </div>
        {rightAction && (
          <div>
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}

export const Card: FC<{ children: any; className?: string }> = ({ children, className }) => {
  return (
    <div class={`bg-white rounded-xl shadow-sm border border-gray-100 ${className || ''}`}>
      {children}
    </div>
  )
}

export const Badge: FC<{ children: any; color?: string }> = ({ children, color = 'gray' }) => {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    primary: 'bg-primary-100 text-primary-800'
  }
  return (
    <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

export const Button: FC<{ children: any; variant?: string; size?: string; className?: string; href?: string; onClick?: string; type?: string; disabled?: boolean }> = 
  ({ children, variant = 'primary', size = 'md', className, href, onClick, type, disabled }) => {
  const variants: Record<string, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700'
  }
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  const baseClass = `inline-flex items-center justify-center font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`
  
  if (href) {
    return <a href={href} class={baseClass}>{children}</a>
  }
  return (
    <button type={type as any || 'button'} class={baseClass} onclick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export const EmptyState: FC<{ icon: string; title: string; description?: string; action?: any }> = 
  ({ icon, title, description, action }) => {
  return (
    <div class="text-center py-12 px-4">
      <i class={`${icon} text-4xl text-gray-300 mb-4`}></i>
      <h3 class="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p class="text-gray-500 text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

export const ProgressBar: FC<{ value: number; max?: number; color?: string; showLabel?: boolean }> = 
  ({ value, max = 100, color = 'primary', showLabel }) => {
  const percent = Math.min(100, Math.round((value / max) * 100))
  const colors: Record<string, string> = {
    primary: 'bg-primary-600',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }
  return (
    <div class="w-full">
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class={`h-2.5 rounded-full ${colors[color] || colors.primary}`} 
          style={`width: ${percent}%`}
        ></div>
      </div>
      {showLabel && (
        <div class="text-right text-xs text-gray-500 mt-1">{percent}%</div>
      )}
    </div>
  )
}
