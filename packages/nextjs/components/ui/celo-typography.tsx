import React from 'react';
import { cn } from '@/lib/utils';

// Typography component props
interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

// Display Typography (Largest)
export function CeloDisplayThin({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={cn('celo-display-thin', className)}>
      {children}
    </Component>
  );
}

export function CeloDisplayThinItalic({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={cn('celo-display-thin-italic', className)}>
      {children}
    </Component>
  );
}

// Heading Typography
export function CeloH1({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={cn('celo-heading-1', className)}>
      {children}
    </Component>
  );
}

export function CeloH2({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={cn('celo-heading-2', className)}>
      {children}
    </Component>
  );
}

export function CeloH3({ children, className, as: Component = 'h3' }: TypographyProps) {
  return (
    <Component className={cn('celo-heading-3', className)}>
      {children}
    </Component>
  );
}

export function CeloH4({ children, className, as: Component = 'h4' }: TypographyProps) {
  return (
    <Component className={cn('celo-heading-4', className)}>
      {children}
    </Component>
  );
}

export function CeloH5({ children, className, as: Component = 'h5' }: TypographyProps) {
  return (
    <Component className={cn('celo-heading-5', className)}>
      {children}
    </Component>
  );
}

// Body Typography
export function CeloBodyLarge({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('celo-body-large', className)}>
      {children}
    </Component>
  );
}

export function CeloBody({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('celo-body', className)}>
      {children}
    </Component>
  );
}

export function CeloBodySmall({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('celo-body-small', className)}>
      {children}
    </Component>
  );
}

// Utility Typography
export function CeloCaption({ children, className, as: Component = 'span' }: TypographyProps) {
  return (
    <Component className={cn('celo-caption', className)}>
      {children}
    </Component>
  );
}

export function CeloLabel({ children, className, as: Component = 'label' }: TypographyProps) {
  return (
    <Component className={cn('celo-label', className)}>
      {children}
    </Component>
  );
}

// Typography utilities for inline usage
export const celoTypographyClasses = {
  displayThin: 'celo-display-thin',
  displayThinItalic: 'celo-display-thin-italic',
  h1: 'celo-heading-1',
  h2: 'celo-heading-2',
  h3: 'celo-heading-3',
  h4: 'celo-heading-4',
  h5: 'celo-heading-5',
  bodyLarge: 'celo-body-large',
  body: 'celo-body',
  bodySmall: 'celo-body-small',
  caption: 'celo-caption',
  label: 'celo-label',
} as const;