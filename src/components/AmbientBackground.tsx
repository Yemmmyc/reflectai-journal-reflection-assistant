import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const AmbientBackground: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-700" aria-hidden="true">
      {/* Light Mode: Warm Amber, Coral Sunset, Lavender & Sky Blue Radiant Glows */}
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-stone-50/80 to-indigo-50/50 transition-colors duration-500">
          {/* Glowing Top-Right Amber/Orange Sunburst Orb */}
          <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-300/50 via-orange-300/40 to-rose-300/30 blur-[90px] animate-ambient-1" />

          {/* Glowing Top-Left Violet / Lavender Orb */}
          <div className="absolute top-16 -left-28 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-300/45 via-purple-300/35 to-pink-200/30 blur-[95px] animate-ambient-2" />

          {/* Glowing Bottom-Center Emerald & Cyan Lagoon Glow */}
          <div className="absolute -bottom-28 left-1/4 w-[650px] h-[550px] rounded-full bg-gradient-to-r from-emerald-300/35 via-teal-200/40 to-cyan-300/35 blur-[100px] animate-ambient-3" />

          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-40" />
        </div>
      )}

      {/* Dark Mode: Deep Cosmic Midnight Nebula with Vivid Violet, Neon Cyan & Stardust */}
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0a09] via-[#141210] to-[#0d0f17] transition-colors duration-500">
          {/* Glowing Top-Right Electric Violet & Fuchsia Nebula */}
          <div className="absolute -top-28 -right-28 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/25 to-pink-700/20 blur-[110px] animate-ambient-1" />

          {/* Glowing Top-Left Electric Cyan & Deep Sapphire Aura */}
          <div className="absolute top-24 -left-28 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/20 to-indigo-900/30 blur-[110px] animate-ambient-2" />

          {/* Glowing Bottom-Center Emerald & Warm Amber Stardust */}
          <div className="absolute -bottom-24 left-1/3 w-[700px] h-[550px] rounded-full bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-amber-500/15 blur-[120px] animate-ambient-3" />

          {/* Starlight Grid Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#57534e_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-35" />
        </div>
      )}
    </div>
  );
};
