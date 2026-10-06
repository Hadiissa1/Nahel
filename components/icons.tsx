import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function HoneyJar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M8 3.5h8M9 3.5v2.2c0 .6-.2 1.1-.6 1.5L7 8.8C6.4 9.4 6 10.2 6 11v7.5A2.5 2.5 0 0 0 8.5 21h7a2.5 2.5 0 0 0 2.5-2.5V11c0-.8-.4-1.6-1-2.2l-1.4-1.6c-.4-.4-.6-.9-.6-1.5V3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 13h12" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M9.5 16.2c.8-.7 1.5-.7 2.5 0s1.7.7 2.5 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Drop(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M12 3.2c3.4 4 5.5 6.8 5.5 9.6A5.5 5.5 0 0 1 12 18.3a5.5 5.5 0 0 1-5.5-5.5C6.5 10 8.6 7.2 12 3.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 13.2a2.5 2.5 0 0 0 2.5 2.3"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Bee(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <ellipse cx="12" cy="14" rx="4" ry="5.5" stroke="currentColor" />
      <path d="M8.5 11.5h7M8 14h8M9 16.5h6" stroke="currentColor" strokeLinecap="round" />
      <path d="M12 8.5 10.4 6M12 8.5 13.6 6" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M8.5 10.5C5.5 8.5 3.5 9 3.5 10.8c0 1.6 2.2 2.4 4.6 1.5M15.5 10.5c3-2 5-1.5 5 .3 0 1.6-2.2 2.4-4.6 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Honeycomb(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M8 3.5h3l1.5 2.6L11 8.7H8L6.5 6.1 8 3.5ZM14 3.5h3l1.5 2.6L17 8.7h-3l-1.5-2.6L14 3.5ZM5 9.6h3l1.5 2.6L8 14.8H5l-1.5-2.6L5 9.6ZM11 9.6h3l1.5 2.6L14 14.8h-3l-1.5-2.6L11 9.6ZM17 9.6h3l1.5 2.6L20 14.8h-3l-1.5-2.6L17 9.6ZM8 15.7h3l1.5 2.6L11 20.9H8l-1.5-2.6L8 15.7ZM14 15.7h3l1.5 2.6L17 20.9h-3l-1.5-2.6L14 15.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hive(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path d="M5 8.5h14M5 12h14M5 15.5h14" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M6 8.5C6 6 8.7 4 12 4s6 2 6 4.5V18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M10.5 15.5h3v4.5h-3z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function Leaf(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M5 19C4 12 8 5 19 5c0 11-7 15-14 14Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 19C8 13 12 10 17 8" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M12 3.5c.5 4.2 1.8 5.5 6 6-4.2.5-5.5 1.8-6 6-.5-4.2-1.8-5.5-6-6 4.2-.5 5.5-1.8 6-6Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Shield(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M12 3.5 5.5 6v5.5c0 4 2.8 7 6.5 8.5 3.7-1.5 6.5-4.5 6.5-8.5V6L12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="m9.2 12 2 2 3.6-3.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Quote(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9.5 6C6.5 7 5 9.3 5 12.6V18h5v-5.4H7.6c0-2 .9-3.2 2.6-3.7L9.5 6Zm9 0C15.5 7 14 9.3 14 12.6V18h5v-5.4h-2.4c0-2 .9-3.2 2.6-3.7L18.5 6Z" />
    </svg>
  );
}

export function Phone(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M6.5 4h3l1.2 3.2-1.7 1.3a11 11 0 0 0 4.5 4.5l1.3-1.7L18 12.5v3a1.5 1.5 0 0 1-1.6 1.5C10.3 16.6 7.4 13.7 5 7.6A1.5 1.5 0 0 1 6.5 4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Mail(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" />
      <path d="m4 7 8 5.5L20 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Pin(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M12 21c4-4.5 6-7.8 6-10.5a6 6 0 1 0-12 0C6 13.2 8 16.5 12 21Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" />
    </svg>
  );
}

export function Cash(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <rect x="3" y="6.5" width="18" height="11" rx="2" stroke="currentColor" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" />
      <path d="M6 9.5v5M18 9.5v5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Card(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" stroke="currentColor" />
      <path d="M3 9.5h18" stroke="currentColor" />
      <path d="M6.5 14.5h3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Wallet(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a2 2 0 0 1 2 2v.5"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <rect x="4" y="7.5" width="16" height="11.5" rx="2.2" stroke="currentColor" />
      <path d="M20 11.5h-3.2a1.8 1.8 0 0 0 0 3.6H20" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function Bag(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path
        d="M6.5 8h11l.9 10.2a2 2 0 0 1-2 2.3H7.6a2 2 0 0 1-2-2.3L6.5 8Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V6.8a3 3 0 0 1 6 0V9"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} {...props}>
      <path d="M12 5.5v13M5.5 12h13" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Minus(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} {...props}>
      <path d="M5.5 12h13" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Trash(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
      <path d="M4.5 7h15M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7 7.3 19a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.5 7" stroke="currentColor" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Close(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} {...props}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Whatsapp(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.9.8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.5 7.5 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.3-.5c.1-.1 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c2.6 1 2.6.7 3.1.6a2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

const ICONS = {
  HoneyJar,
  Drop,
  Bee,
  Honeycomb,
  Hive,
  Leaf,
  Sparkle,
  Shield,
  Cash,
  Card,
  Wallet,
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & IconProps) {
  const Cmp = ICONS[name];
  return <Cmp {...props} />;
}
