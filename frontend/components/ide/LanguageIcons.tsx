'use client';

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export function PythonIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
      <path
        d="M63.58 6.5c-29.43 0-27.6 12.77-27.6 12.77l.03 13.23h28.16v3.97H24.3S6.5 34.43 6.5 63.8c0 29.38 15.54 28.37 15.54 28.37h9.27v-12.98s-.5-15.53 15.28-15.53h28.13s14.77.25 14.77-14.28V20.77S91.95 6.5 63.58 6.5zm-15.02 8.7a4.64 4.64 0 110 9.27 4.64 4.64 0 010-9.28z"
        fill="#387EB8"
      />
      <path
        d="M64.42 121.5c29.43 0 27.6-12.77 27.6-12.77l-.03-13.23H63.83v-3.97h39.87s17.8 2.04 17.8-27.33c0-29.38-15.54-28.37-15.54-28.37h-9.27v12.98s.5 15.53-15.28 15.53H53.28s-14.77-.25-14.77 14.28v28.61s-2.46 14.27 25.91 14.27zm15.02-8.7a4.64 4.64 0 110-9.27 4.64 4.64 0 010 9.28z"
        fill="#FFE052"
      />
    </svg>
  );
}

export function JavaScriptIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="16" fill="#F7DF1E" />
      <path
        d="M34.7 101.5c3.2 5.1 7.4 9 14.9 9 6.2 0 10.2-3.1 10.2-7.5 0-5.2-4.1-7.1-11.1-10.1l-3.8-1.6c-11-4.7-18.3-10.6-18.3-23.2 0-11.5 8.9-20.3 22.8-20.3 9.9 0 17 3.5 21.8 11.9l-11.3 7.2c-2.5-4.5-5.3-6.4-10.5-6.4-4.7 0-7.8 3-7.8 6.9 0 4.4 2.8 6.3 9.2 9l3.8 1.6c13 5.6 20.4 11.3 20.4 24.3 0 13.9-10.9 21.4-25.7 21.4-14.4 0-23.4-6.9-27.8-15.3l11.4-7.4h-.1zM100.9 49v45.1c0 8.6-4.9 12.7-12.7 12.7-7 0-11.2-3.6-13.8-8.6l10.9-6.3c1.6 2.6 3.1 4.2 5.7 4.2 2.6 0 4.4-1.2 4.4-5.9V49h5.5z"
        fill="#000"
      />
    </svg>
  );
}

export function TypeScriptIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="16" fill="#3178C6" />
      <path
        d="M27.2 60.5h16.2v46.1h13.9V60.5h16.2V49H27.2v11.5zm47.9 29.8c3.2 5.1 7.4 9 14.9 9 6.2 0 10.2-3.1 10.2-7.5 0-5.2-4.1-7.1-11.1-10.1l-3.8-1.6c-11-4.7-18.3-10.6-18.3-23.2 0-11.5 8.9-20.3 22.8-20.3 9.9 0 17 3.5 21.8 11.9l-11.3 7.2c-2.5-4.5-5.3-6.4-10.5-6.4-4.7 0-7.8 3-7.8 6.9 0 4.4 2.8 6.3 9.2 9l3.8 1.6c13 5.6 20.4 11.3 20.4 24.3 0 13.9-10.9 21.4-25.7 21.4-14.4 0-23.4-6.9-27.8-15.3l11.4-7.4h-.1z"
        fill="#FFF"
      />
    </svg>
  );
}

export function CIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path d="M64 8l52 30v60l-52 30-52-30V38L64 8z" fill="#00599C" />
      <path
        d="M87 47.5c-6.1-5.6-14.4-8.8-23-8.8-18.8 0-34 15.2-34 34s15.2 34 34 34c8.6 0 16.9-3.2 23-8.8l-8.5-9.8c-4 3.7-9.2 5.7-14.5 5.7-11.7 0-21.1-9.4-21.1-21.1s9.4-21.1 21.1-21.1c5.3 0 10.5 2 14.5 5.7L87 47.5z"
        fill="#FFF"
      />
    </svg>
  );
}

export function CppIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path d="M64 8l52 30v60l-52 30-52-30V38L64 8z" fill="#004482" />
      <path
        d="M72 47.5c-4.9-4.5-11.5-7-18.4-7-15 0-27.2 12.2-27.2 27.2s12.2 27.2 27.2 27.2c6.9 0 13.5-2.6 18.4-7.1l-6.8-7.8c-3.2 3-7.4 4.6-11.6 4.6-9.4 0-16.9-7.5-16.9-16.9s7.5-16.9 16.9-16.9c4.2 0 8.4 1.6 11.6 4.6l6.8-7.9z"
        fill="#FFF"
      />
      <path d="M78 62.5h6v-6h3v6h6v3h-6v6h-3v-6h-6v-3zM97 62.5h6v-6h3v6h6v3h-6v6h-3v-6h-6v-3z" fill="#FFF" />
    </svg>
  );
}

export function JavaIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path
        d="M48.2 92.5c15.2 2.3 35.8 2.6 48.9-6.3 0 0-4.4 3.7-12.7 6.7-18.8 6.9-44.5 4.8-49.3 2.1-1.6-.9 3.5-2.2 13.1-2.5zm-5.7-12.4c12.3 1.9 29.5 2 40.7-4.6 0 0-3.6 2.6-10.4 4.8-15.6 5-36.9 3.4-40.9 1.5-1.4-.7 2.9-1.5 10.6-1.7zm38.8-21.7c5.2 6-2.5 11.6-2.5 11.6s6.3-3.3 3.3-8.8c-2.9-5.3-7.7-7.9-14.7-14.8-5.5-5.5-3.3-10.6-3.3-10.6s-3.7 4.1.3 10.1c4.5 6.7 10.9 8.2 16.9 12.5zM61.8 17.5c4.7 5.3-2.3 10.4-2.3 10.4s5.7-2.9 3-7.9c-2.6-4.8-6.9-7.1-13.2-13.3-4.9-5-3-9.5-3-9.5s-3.3 3.7.3 9.1c4 5.9 9.8 7.3 15.2 11.2zm37.3 84.8c-7.8 5.9-43.2 8.4-65.7.8-2.6-.9 0-3 0-3 17.5 4.3 47.9 3.5 60.1-2.1 4.5-2 5.6 4.3 5.6 4.3z"
        fill="#EA2D2E"
      />
      <path
        d="M87.5 108.7c-21.3 7-56.7 4.2-66.2-.8-3.7-2 .9-3.2.9-3.2 17.1 3.5 47.8 2.3 60.5-2.1 6.5-2.3 4.8 6.1 4.8 6.1zm-4.7 7.7c-17.7 5.8-47 3.5-54.8-.7-3.1-1.6.8-2.6.8-2.6 14.2 2.9 39.6 1.9 50.1-1.7 5.4-1.9 3.9 5 3.9 5z"
        fill="#5382A1"
      />
    </svg>
  );
}

export function RustIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <circle cx="64" cy="64" r="54" fill="#000" />
      <path
        d="M64 16l3.5 10.8 11.3-1.2 1.2 11.3 10.8 3.5-1.2 11.3 8.3 7.8-3.5 10.8 5.7 9.8-5.7 9.8 3.5 10.8-8.3 7.8 1.2 11.3-10.8 3.5-1.2 11.3-11.3-1.2L64 128l-3.5-10.8-11.3 1.2-1.2-11.3-10.8-3.5 1.2-11.3-8.3-7.8 3.5-10.8-5.7-9.8 5.7-9.8-3.5-10.8 8.3-7.8-1.2-11.3 10.8-3.5 1.2-11.3 11.3 1.2L64 16z"
        fill="#DEA584"
      />
      <circle cx="64" cy="64" r="42" fill="#000" />
      <path
        d="M48 42h18c8.3 0 14 4.5 14 12 0 5.4-3.1 9.6-8.2 11.2l9.8 18.8H69.4L60.8 67H58v17H48V42zm10 16.5h7c3.3 0 5.5-1.7 5.5-4.5s-2.2-4.5-5.5-4.5h-7v9z"
        fill="#FFF"
      />
    </svg>
  );
}

export function GoIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="16" fill="#00ADD8" />
      <path
        d="M58 64c0 14.4-9.6 24-23 24s-23-9.6-23-24 9.6-24 23-24c7.2 0 13.2 2.7 17.5 7.5L44 54.5c-2.4-2.7-5.4-4-9-4-7.2 0-12 5.7-12 13.5s4.8 13.5 12 13.5c6 0 10.5-3.6 11.5-8.5H35v-9h23v4zM116 64c0 14.4-10.2 24-24 24s-24-9.6-24-24 10.2-24 24-24 24 9.6 24 24zm-11 0c0-8.4-5.4-14.4-13-14.4s-13 6-13 14.4 5.4 14.4 13 14.4 13-6 13-14.4z"
        fill="#FFF"
      />
    </svg>
  );
}

export function RubyIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path
        d="M17 38l22-26h50l22 26-47 78L17 38z"
        fill="#CC342D"
      />
      <path
        d="M39 12l25 26-47 0L39 12zm50 0l-25 26 47 0L89 12zM64 38L17 38l47 78 0-78zm0 0l47 0-47 78 0-78z"
        fill="#FFF"
        opacity="0.3"
      />
    </svg>
  );
}

export function PhpIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <ellipse cx="64" cy="64" rx="58" ry="36" fill="#777BB4" />
      <path
        d="M32 50h12c7 0 11 3.5 11 9s-4 9-11 9h-6l-3.5 14H24L32 50zm11 12c3 0 5-1.5 5-3.5s-2-3.5-5-3.5h-5l-1.8 7h5zm21-12h11l-2 8h8c7 0 10.5 3.5 10.5 9s-3.5 9-10.5 9h-6l-3.5 14H61l8-32v-8h-5zm18 12c3 0 5-1.5 5-3.5s-2-3.5-5-3.5h-5l-1.8 7h5zm22-12h12c7 0 11 3.5 11 9s-4 9-11 9h-6l-3.5 14H93l8-32zm11 12c3 0 5-1.5 5-3.5s-2-3.5-5-3.5h-5l-1.8 7h5z"
        fill="#FFF"
      />
    </svg>
  );
}

export function CSharpIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path d="M64 8l52 30v60l-52 30-52-30V38L64 8z" fill="#239120" />
      <path
        d="M72 47.5c-4.9-4.5-11.5-7-18.4-7-15 0-27.2 12.2-27.2 27.2s12.2 27.2 27.2 27.2c6.9 0 13.5-2.6 18.4-7.1l-6.8-7.8c-3.2 3-7.4 4.6-11.6 4.6-9.4 0-16.9-7.5-16.9-16.9s7.5-16.9 16.9-16.9c4.2 0 8.4 1.6 11.6 4.6l6.8-7.9z"
        fill="#FFF"
      />
      <path
        d="M84 57h3v-4h2v4h4v2h-4v4h4v2h-4v4h-2v-4h-3v4h-2v-4h-4v-2h4v-4h-4v-2h4v-4h2v4zm2 6h3v-4h-3v4z"
        fill="#FFF"
      />
    </svg>
  );
}

export function KotlinIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <defs>
        <linearGradient id="ktGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E4485D" />
          <stop offset="50%" stopColor="#C711E1" />
          <stop offset="100%" stopColor="#7F52FF" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="16" fill="url(#ktGrad)" />
      <path d="M16 16h96L64 64l48 48H16V16z" fill="#FFF" opacity="0.9" />
    </svg>
  );
}

export function RIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <ellipse cx="64" cy="64" rx="54" ry="46" fill="#198CE7" />
      <path
        d="M42 42h28c11 0 18 5 18 14 0 7.5-5 12-12 13.5l14 20.5H75l-12-18h-9v18H42V42zm12 18h14c5 0 8-2 8-5.5s-3-5.5-8-5.5H54V60z"
        fill="#FFF"
      />
    </svg>
  );
}

export function LuaIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <circle cx="64" cy="64" r="54" fill="#000080" />
      <circle cx="86" cy="42" r="14" fill="#FFF" />
      <circle cx="48" cy="74" r="28" fill="#FFF" />
      <circle cx="58" cy="64" r="20" fill="#000080" />
    </svg>
  );
}

export function SqlIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="16" fill="#0064a5" />
      <ellipse cx="64" cy="38" rx="36" ry="14" fill="#FFF" />
      <path d="M28 38v24c0 7.7 16.1 14 36 14s36-6.3 36-14V38H28z" fill="#FFF" opacity="0.8" />
      <path d="M28 62v24c0 7.7 16.1 14 36 14s36-6.3 36-14V62H28z" fill="#FFF" opacity="0.6" />
    </svg>
  );
}

export function HtmlIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path d="M19 114L9 14h110l-10 100-45 14-45-14z" fill="#E44D26" />
      <path d="M64 116l37-11 8-83H64v94z" fill="#F16529" />
      <path
        d="M64 52h19l-1.3 14H64v15h16.3l-1.5 17-14.8 4V116l27-7.5 3.5-39.5H64V52zm0-24h39l-1 11H64V28z"
        fill="#FFF"
      />
      <path
        d="M64 52H45l1.3-13H64V28H32l3.5 39H64v-15zm0 32l-12-3.2-.8-9.8H38.5l1.5 19.5 24 6.5V84z"
        fill="#EBEBEB"
      />
    </svg>
  );
}

export function getLanguageIcon(slug: string, size = 22): React.ReactNode {
  switch (slug.toLowerCase()) {
    case 'python':
      return <PythonIcon size={size} />;
    case 'javascript':
    case 'js':
      return <JavaScriptIcon size={size} />;
    case 'typescript':
    case 'ts':
      return <TypeScriptIcon size={size} />;
    case 'c':
      return <CIcon size={size} />;
    case 'cpp':
      return <CppIcon size={size} />;
    case 'java':
      return <JavaIcon size={size} />;
    case 'rust':
      return <RustIcon size={size} />;
    case 'go':
      return <GoIcon size={size} />;
    case 'ruby':
      return <RubyIcon size={size} />;
    case 'php':
      return <PhpIcon size={size} />;
    case 'csharp':
    case 'cs':
      return <CSharpIcon size={size} />;
    case 'kotlin':
    case 'kt':
      return <KotlinIcon size={size} />;
    case 'r':
      return <RIcon size={size} />;
    case 'lua':
      return <LuaIcon size={size} />;
    case 'sql':
      return <SqlIcon size={size} />;
    case 'html':
      return <HtmlIcon size={size} />;
    default:
      return <CIcon size={size} />;
  }
}
