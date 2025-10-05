import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'shield-eye' | 'minimal' | 'badge';
  className?: string;
  showText?: boolean;
  monochrome?: boolean;
}

export const BizzyLogo: React.FC<LogoProps> = ({ 
  size = 60, 
  variant = 'shield-eye',
  className = '',
  showText = false,
  monochrome = false
}) => {
  // Shield Eye Logo - Professional + Abstract Concept
  if (variant === 'shield-eye') {
    return (
      <div className="flex items-center gap-4">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 60 60" 
          className={`bizzy-logo-shield-eye ${className}`}
        >
          {/* Shield Base - Professional Trust */}
          <path 
            d="M30 5 L55 15 L55 45 L30 55 L5 45 L5 15 Z" 
            fill={monochrome ? "#1F2937" : "url(#shieldGradient)"} 
            stroke={monochrome ? "#111827" : "#1E40AF"} 
            strokeWidth="2.5"
          />
          
          {/* Abstract Business Eye - The Core Concept */}
          <circle cx="30" cy="30" r="15" fill="white" stroke={monochrome ? "#374151" : "#E0F2FE"} strokeWidth="1"/>
          
          {/* Iris - Business Intelligence */}
          <circle cx="30" cy="30" r="9" fill={monochrome ? "#3B82F6" : "url(#eyeGradient)"} stroke={monochrome ? "#1E40AF" : "#1E40AF"} strokeWidth="1.5"/>
          
          {/* Pupil - Sharp Focus */}
          <circle cx="30" cy="30" r="4" fill={monochrome ? "#0F172A" : "#0F172A"}/>
          
          {/* Data Streams Flowing Outward - Business Watching Itself */}
          <path d="M30 15 Q25 20 20 25" stroke={monochrome ? "#10B981" : "#10B981"} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M45 30 Q40 35 35 40" stroke={monochrome ? "#3B82F6" : "#3B82F6"} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M30 45 Q25 40 20 35" stroke={monochrome ? "#F59E0B" : "#F59E0B"} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M15 30 Q20 25 25 20" stroke={monochrome ? "#EF4444" : "#EF4444"} strokeWidth="2" fill="none" strokeLinecap="round"/>
          
          {/* Data Points Being Watched - Key Metrics */}
          <circle cx="18" cy="18" r="2" fill={monochrome ? "#10B981" : "#10B981"}/>
          <circle cx="42" cy="18" r="2" fill={monochrome ? "#3B82F6" : "#3B82F6"}/>
          <circle cx="42" cy="42" r="2" fill={monochrome ? "#F59E0B" : "#F59E0B"}/>
          <circle cx="18" cy="42" r="2" fill={monochrome ? "#EF4444" : "#EF4444"}/>
          
          {/* Awareness Glow - Continuous Monitoring */}
          <circle cx="30" cy="30" r="18" fill="none" stroke={monochrome ? "#6B7280" : "#E0F2FE"} strokeWidth="1" strokeDasharray="3,2" opacity="0.7"/>
          
          {/* Professional Border */}
          <circle cx="30" cy="30" r="27" fill="none" stroke={monochrome ? "#374151" : "url(#borderGradient)"} strokeWidth="1" opacity="0.8"/>
          
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF"/>
              <stop offset="50%" stopColor="#2563EB"/>
              <stop offset="100%" stopColor="#3B82F6"/>
            </linearGradient>
            <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="100%" stopColor="#1E40AF"/>
            </linearGradient>
            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="50%" stopColor="#8B5CF6"/>
              <stop offset="100%" stopColor="#EC4899"/>
            </linearGradient>
          </defs>
        </svg>
        
        {showText && (
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent tracking-tight">
              BIZZY
            </span>
            <span className="text-xs font-medium text-gray-600 -mt-1 tracking-wide">
              Your trusted business eye
            </span>
          </div>
        )}
      </div>
    );
  }

  // Minimal Variant
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-3">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 60 60" 
          className={`bizzy-logo-minimal ${className}`}
        >
          <circle cx="30" cy="30" r="28" fill={monochrome ? "#1F2937" : "#1E40AF"}/>
          <circle cx="30" cy="30" r="20" fill="white"/>
          <circle cx="30" cy="30" r="12" fill="#3B82F6"/>
          <circle cx="30" cy="30" r="5" fill="#0F172A"/>
          <circle cx="30" cy="30" r="25" fill="none" stroke="#E0F2FE" strokeWidth="1" strokeDasharray="2,2"/>
        </svg>
        
        {showText && (
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">Bizzy</span>
            <span className="text-xs text-gray-500 -mt-1">Business Eye</span>
          </div>
        )}
      </div>
    );
  }

  // Badge Variant
  if (variant === 'badge') {
    return (
      <div className="flex items-center gap-3">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 60 60" 
          className={`bizzy-logo-badge ${className}`}
        >
          <circle cx="30" cy="30" r="28" fill={monochrome ? "#1F2937" : "url(#badgeGradient)"}/>
          <circle cx="30" cy="30" r="24" fill="white"/>
          <circle cx="30" cy="30" r="16" fill="url(#eyeGradient)"/>
          <circle cx="30" cy="30" r="6" fill="#0F172A"/>
          <path d="M20 20 L25 15 L35 15 L40 20 L40 30 L35 35 L25 35 L20 30 Z" fill="none" stroke="#10B981" strokeWidth="2"/>
        </svg>
        
        {showText && (
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">Bizzy</span>
            <span className="text-xs text-gray-500 -mt-1">Analytics</span>
          </div>
        )}
      </div>
    );
  }

  // Default to Shield Eye
  return (
    <div className="flex items-center gap-4">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 60 60" 
        className={`bizzy-logo-shield-eye ${className}`}
      >
        <path 
          d="M30 5 L55 15 L55 45 L30 55 L5 45 L5 15 Z" 
          fill="url(#shieldGradient)" 
          stroke="#1E40AF" 
          strokeWidth="2.5"
        />
        <circle cx="30" cy="30" r="15" fill="white" stroke="#E0F2FE" strokeWidth="1"/>
        <circle cx="30" cy="30" r="9" fill="url(#eyeGradient)" stroke="#1E40AF" strokeWidth="1.5"/>
        <circle cx="30" cy="30" r="4" fill="#0F172A"/>
        <path d="M30 15 Q25 20 20 25" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M45 30 Q40 35 35 40" stroke="#3B82F6" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M30 45 Q25 40 20 35" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M15 30 Q20 25 25 20" stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="2" fill="#10B981"/>
        <circle cx="42" cy="18" r="2" fill="#3B82F6"/>
        <circle cx="42" cy="42" r="2" fill="#F59E0B"/>
        <circle cx="18" cy="42" r="2" fill="#EF4444"/>
        <circle cx="30" cy="30" r="18" fill="none" stroke="#E0F2FE" strokeWidth="1" strokeDasharray="3,2" opacity="0.7"/>
        <circle cx="30" cy="30" r="27" fill="none" stroke="url(#borderGradient)" strokeWidth="1" opacity="0.8"/>
        
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF"/>
            <stop offset="50%" stopColor="#2563EB"/>
            <stop offset="100%" stopColor="#3B82F6"/>
          </linearGradient>
          <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6"/>
            <stop offset="100%" stopColor="#1E40AF"/>
          </linearGradient>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6"/>
            <stop offset="50%" stopColor="#8B5CF6"/>
            <stop offset="100%" stopColor="#EC4899"/>
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent tracking-tight">
            BIZZY
          </span>
          <span className="text-xs font-medium text-gray-600 -mt-1 tracking-wide">
            Your trusted business eye
          </span>
        </div>
      )}
    </div>
  );
};

export default BizzyLogo;
