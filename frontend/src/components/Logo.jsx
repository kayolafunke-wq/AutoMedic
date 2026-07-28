import React from 'react'

/**
 * Official AutoMedic Logo Component (Logo 2 Image Asset + AutoMedic Brand Text)
 * Displays the high-res Logo 2 mark alongside the bold AutoMedic typography.
 */
export default function Logo({ 
  className = '', 
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  theme = 'dark', // 'dark' (for white/light backgrounds) | 'light' (for dark backgrounds)
  showText = true
}) {
  const heights = {
    xs: 'h-7',
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-20',
  }

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  const hClass = heights[size] || 'h-11'
  const tClass = textSizes[size] || 'text-xl'
  const textColor = theme === 'light' ? 'text-white' : 'text-[#1A1A2E]'

  if (theme === 'light') {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <div className="bg-white px-2 py-1 rounded-xl shadow-sm flex items-center justify-center">
          <img 
            src="/logo.jpg" 
            alt="AutoMedic" 
            className={`${hClass} w-auto object-contain select-none`}
          />
        </div>
        {showText && (
          <span className={`font-black tracking-tight leading-none ${tClass}`}>
            <span className={textColor}>Auto</span>
            <span className="text-[#B8860B]">Medic</span>
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img 
        src="/logo.jpg" 
        alt="AutoMedic" 
        className={`${hClass} w-auto object-contain select-none mix-blend-multiply`}
      />
      {showText && (
        <span className={`font-black tracking-tight leading-none ${tClass}`}>
          <span className={textColor}>Auto</span>
          <span className="text-[#B8860B]">Medic</span>
        </span>
      )}
    </div>
  )
}
