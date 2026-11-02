'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  withLink?: boolean;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  textClassName?: string;
}

const SIZE_MAP = {
  xs: { img: 24, text: '14px', gap: '6px' },
  sm: { img: 32, text: '17px', gap: '8px' },
  md: { img: 42, text: '21px', gap: '10px' },
  lg: { img: 56, text: '26px', gap: '12px' },
  xl: { img: 80, text: '34px', gap: '16px' },
};

export default function Logo({
  size = 'md',
  showText = true,
  withLink = false,
  href = '/',
  className = '',
  style = {},
  textClassName = '',
}: LogoProps) {
  const sizeConfig = typeof size === 'number'
    ? { img: size, text: `${Math.round(size * 0.5)}px`, gap: `${Math.round(size * 0.25)}px` }
    : SIZE_MAP[size] || SIZE_MAP.md;

  const content = (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeConfig.gap,
        textDecoration: 'none',
        color: 'inherit',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${sizeConfig.img}px`,
          height: `${sizeConfig.img}px`,
          flexShrink: 0,
          filter: 'drop-shadow(0 2px 8px rgba(46, 125, 50, 0.22))',
          transition: 'transform 0.2s ease',
        }}
      >
        <Image
          src="/logo.png"
          alt="ChristianConnect Official Logo"
          width={sizeConfig.img * 2}
          height={sizeConfig.img * 2}
          priority
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            className={textClassName}
            style={{
              fontSize: sizeConfig.text,
              fontWeight: 800,
              fontFamily: 'var(--font-serif, Georgia, serif)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary, #212121)',
            }}
          >
            Christian<span className="gradient-text" style={{ color: 'var(--brand-primary, #2e7d32)' }}>Connect</span>
          </span>
          {typeof size === 'string' && ['md', 'lg', 'xl'].includes(size) && (
            <span
              style={{
                fontSize: `${Math.max(9, Math.round(sizeConfig.img * 0.22))}px`,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--brand-primary, #2e7d32)',
                fontWeight: 700,
                marginTop: '1px',
              }}
            >
              Faith-First Community
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }

  return content;
}
