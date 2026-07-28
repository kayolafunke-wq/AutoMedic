import React from 'react'

/**
 * Official AutoMedic Logo Component (Logo 2 Image Asset)
 * Renders the exact high-res Logo 2 image chosen by the user.
 */
export default function Logo({ 
  className = '', 
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  theme = 'dark' // 'dark' (for white/light backgrounds) | 'light' (for dark backgrounds)
}) {
  const heights = {
    xs: 'h-8',
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  }

  const hClass = heights[size] || 'h-12'

  if (theme === 'light') {
    // For dark headers, footers & sidebars: wrap in a crisp, clean white pill badge
    return (
      <div className={`inline-flex items-center bg-white px-2.5 py-1 rounded-xl shadow-sm ${className}`}>
        <img 
          src="/logo.jpg" 
          alt="AutoMedic Logo" 
          className={`${hClass} w-auto object-contain select-none`}
        />
      </div>
    )
  }

  // For light/white headers: render image with mix-blend-multiply so background blends seamlessly
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img 
        src="/logo.jpg" 
        alt="AutoMedic Logo" 
        className={`${hClass} w-auto object-contain select-none mix-blend-multiply`}
      />
    </div>
  )
}
