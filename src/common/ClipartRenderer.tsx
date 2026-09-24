import React from 'react';
import { resolveClipartItem, ResolvedClipart, ClipartItem, CLIPART_REGISTRY } from '../data/clipartRegistry';
import { fixMojibake } from '../utils/visualUtils';

// Pre-build regex for matching registered emojis
const registeredEmojis: string[] = CLIPART_REGISTRY
  .map((c: ClipartItem) => c.emojiEquivalent)
  .filter((e: string | undefined): e is string => Boolean(e));

const emojiPattern = registeredEmojis
  .sort((a: string, b: string) => b.length - a.length)
  .map((e: string) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const clipartTagRegex = emojiPattern
  ? new RegExp(`(\\[(?:clipart:)?[a-zA-Z0-9_\\-\\.\\/]+\\]|${emojiPattern})`, 'gu')
  : /(\[(?:clipart:)?[a-zA-Z0-9_\-\.\/]+\])/g;

interface ClipartImageProps {
  clipart?: ResolvedClipart | ClipartItem | string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animation?: 'bounce' | 'pulse' | 'spin' | 'none';
  showLabel?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20 sm:w-24 sm:h-24',
  xl: 'w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44'
};

export const ClipartImage: React.FC<ClipartImageProps> = ({
  clipart,
  size = 'md',
  className = '',
  animation = 'none',
  showLabel = false
}) => {
  const resolved: ResolvedClipart | null = (() => {
    if (!clipart) return null;
    if (typeof clipart === 'string') {
      return resolveClipartItem(clipart);
    }
    if ('isImage' in clipart) {
      return clipart as ResolvedClipart;
    }
    // ClipartItem
    if ('path' in clipart) {
      return resolveClipartItem(clipart.path || (clipart as any).keywords?.[0]);
    }
    return null;
  })();

  if (!resolved) return null;

  const animClass = animation === 'bounce'
    ? 'animate-bounce'
    : animation === 'pulse'
    ? 'animate-pulse'
    : animation === 'spin'
    ? 'animate-spin'
    : '';

  if (resolved.isImage && resolved.src) {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <img
          src={resolved.src}
          alt={resolved.alt || 'Clipart'}
          className={`${sizeClasses[size]} object-contain select-none filter drop-shadow-xs transition-transform duration-200 ${animClass}`}
          onError={(e) => {
            if (resolved.fallbackSrc && e.currentTarget.src !== resolved.fallbackSrc) {
              e.currentTarget.src = resolved.fallbackSrc;
            } else if (resolved.emoji) {
              // Replace broken image with emoji fallback
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.className = 'text-3xl select-none';
                span.textContent = resolved.emoji;
                parent.prepend(span);
              }
            }
          }}
        />
        {showLabel && resolved.alt && (
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
            {resolved.alt}
          </span>
        )}
      </div>
    );
  }

  // Fallback: Unicode Emoji
  return (
    <span className={`inline-flex items-center justify-center select-none text-2xl sm:text-3xl ${animClass} ${className}`}>
      {resolved.emoji || fixMojibake(resolved.alt) || '✨'}
    </span>
  );
};

interface ClipartTextProps {
  text: string;
  className?: string;
  imageSize?: 'xs' | 'sm' | 'md';
}

/**
 * Renders text with inline clipart illustrations wherever [clipart:id], [apple],
 * or registered emojis (e.g. 🐱, 🐶, 🍎, 🍌, ⭐, 🪙) appear.
 * Seamlessly replaces raw emojis with high-res vector graphics!
 */
export const ClipartText: React.FC<ClipartTextProps> = ({
  text,
  className = '',
  imageSize = 'sm'
}) => {
  if (!text) return null;

  const parts = text.split(clipartTagRegex);

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {parts.map((part, idx) => {
        if (!part) return null;
        const match = part.match(/^\[(?:clipart:)?([a-zA-Z0-9_\-\.\/]+)\]$/i);
        if (match) {
          const resolved = resolveClipartItem(match[1]);
          if (resolved && resolved.isImage) {
            return (
              <span key={idx} className="inline-flex items-center align-middle mx-0.5">
                <ClipartImage clipart={resolved} size={imageSize} />
              </span>
            );
          }
          if (resolved?.emoji) {
            return <span key={idx} className="text-xl align-middle mx-0.5">{resolved.emoji}</span>;
          }
        } else if (registeredEmojis.includes(part)) {
          const resolved = resolveClipartItem(part);
          if (resolved && resolved.isImage) {
            return (
              <span key={idx} className="inline-flex items-center align-middle mx-0.5">
                <ClipartImage clipart={resolved} size={imageSize} />
              </span>
            );
          }
        }
        return <span key={idx}>{fixMojibake(part)}</span>;
      })}
    </span>
  );
};
