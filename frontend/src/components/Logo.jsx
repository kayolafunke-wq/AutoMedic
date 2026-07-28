import React from 'react'

/**
 * AutoMedic Official Logo Component (Logo 2 design)
 * Supports multiple variants and sizes:
 * - variant="full" (Icon + AutoMedic text + optional tagline)
 * - variant="icon" (Icon mark only)
 * - variant="light" (For dark backgrounds)
 * - showTagline={true} (Shows "YOUR CAR. OUR EXPERTISE. ZERO GUESSWORK.")
 */
export default function Logo({ 
  className = '', 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'full', 
  theme = 'dark', // 'dark' (default text) | 'light' (white text)
  showTagline = false 
}) {
  // Size mappings for icon height
  const iconSizes = {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 56,
    xl: 72,
  }

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  const iconDim = iconSizes[size] || 44
  const textSize = textSizes[size] || 'text-xl'

  const darkTextColor = theme === 'light' ? '#FFFFFF' : '#1A1A2E'
  const goldColor     = '#B8860B'

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-3">
        {/* ── LOGO MARK SVG ── */}
        <svg 
          width={iconDim} 
          height={iconDim} 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 drop-shadow-sm"
        >
          {/* 1. SPEEDOMETER GAUGE ARCH (Top) */}
          <path 
            d="M 55 75 A 55 55 0 0 1 145 75" 
            stroke="#1A1A2E" 
            strokeWidth="8" 
            strokeLinecap="round" 
            fill="none" 
          />
          <path 
            d="M 125 40 A 55 55 0 0 1 148 70" 
            stroke={goldColor} 
            strokeWidth="10" 
            strokeDasharray="6 6" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Speedometer Needle */}
          <line x1="100" y1="75" x2="125" y2="45" stroke={goldColor} strokeWidth="6" strokeLinecap="round" />
          <circle cx="100" cy="75" r="7" fill={goldColor} />

          {/* 2. BOLD "M" LETTERFORM */}
          {/* Left Stem (Gold Gradient & Wrench cut) */}
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A020" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <linearGradient id="darkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D3748" />
              <stop offset="100%" stopColor="#1A1A2E" />
            </linearGradient>
          </defs>

          {/* Left Wing (Gold) */}
          <path 
            d="M 45 65 L 98 120 L 98 165 L 45 165 Z" 
            fill="url(#goldGrad)" 
          />
          
          {/* Right Wing (Dark Charcoal) */}
          <path 
            d="M 102 120 L 155 65 L 155 165 L 102 165 Z" 
            fill="url(#darkGrad)" 
          />

          {/* Wrench Cutout on Left Gold Wing */}
          <path 
            d="M 52 160 L 78 108 C 72 104 68 96 72 88 C 76 80 86 78 92 84 C 95 87 96 92 94 96 L 76 130 Z" 
            fill="#FFFFFF" 
          />

          {/* 3. SLEEK CAR SILHOUETTE BASE */}
          <path 
            d="M 35 155 C 55 145 75 140 100 140 C 135 140 160 152 170 162 C 150 160 120 158 100 158 C 70 158 45 160 35 155 Z" 
            fill="#1A1A2E" 
          />
          {/* Car Roof & Windshield Arc */}
          <path 
            d="M 55 150 C 70 135 100 130 140 145 C 120 138 90 137 70 146 Z" 
            fill="url(#goldGrad)" 
          />
          {/* Headlight Accent */}
          <ellipse cx="160" cy="156" rx="4" ry="2" fill={goldColor} />
        </svg>

        {/* ── TEXT BRANDING ── */}
        {variant !== 'icon' && (
          <div className="flex flex-col">
            <span className={`font-black tracking-tight leading-none ${textSize}`}>
              <span style={{ color: darkTextColor }}>Auto</span>
              <span style={{ color: goldColor }}>Medic</span>
            </span>
          </div>
        )}
      </div>

      {/* ── OPTIONAL TAGLINE ── */}
      {showTagline && variant !== 'icon' && (
        <div className="flex items-center gap-2 mt-1.5 opacity-80">
          <span className="h-[1px] w-4 bg-[#B8860B]" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-gray-500">
            YOUR CAR. OUR EXPERTISE. ZERO GUESSWORK.
          </span>
          <span className="h-[1px] w-4 bg-[#B8860B]" />
        </div>
      )}
    </div>
  )
}
