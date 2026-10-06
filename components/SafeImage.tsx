"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * An <img> that gracefully falls back to a honey-gradient + themed icon if the
 * remote photo fails to load — so a visitor never sees a broken image.
 */
export function SafeImage({
  src,
  alt,
  icon = "HoneyJar",
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  icon?: IconName;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-honey-light via-honey to-amber",
        className,
      )}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-label={alt}>
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1.4px)] [background-size:16px_16px]" />
          <Icon name={icon} className="relative h-1/3 w-1/3 text-white/95" stroke="currentColor" />
        </div>
      )}
    </div>
  );
}
