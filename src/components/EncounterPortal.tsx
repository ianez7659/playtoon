"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface EncounterPortalProps {
  onEncounter: () => void;
}

export default function EncounterPortal({ onEncounter }: EncounterPortalProps) {
  const portalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!portalRef.current || !titleRef.current || !subtitleRef.current) return;

    // Initial setup - move text off screen
    gsap.set([titleRef.current, subtitleRef.current], {
      x: (index) => index === 0 ? -window.innerWidth : window.innerWidth,
      opacity: 0
    });

    // Portal background animation
    gsap.fromTo(portalRef.current, 
      { opacity: 0 },
      { 
        opacity: 1, 
        duration: 0.5,
        ease: "power2.out"
      }
    );

    // Animation: text pulled in from left and right to center
    const tl = gsap.timeline();
    
    tl.to(titleRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out"
    })
    .to(subtitleRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4") // Start 0.4s earlier (overlapping effect)
    .to([titleRef.current, subtitleRef.current], {
      scale: 1.1,
      duration: 0.3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1
    }, "+=0.5"); // Start after 0.5s

    // Start battle after 2.5s
    const timer = setTimeout(() => {
      onEncounter();
    }, 2500);

    return () => {
      clearTimeout(timer);
      tl.kill();
    };
  }, [onEncounter]);

  return (
    <div 
      ref={portalRef}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000]"
    >
      <div className="text-center">
        <h2 
          ref={titleRef}
          className="text-6xl font-bold text-red-600 mb-4"
        >
          ENCOUNTER!
        </h2>
        <p 
          ref={subtitleRef}
          className="text-2xl text-gray-300"
        >
          Battle begins...
        </p>
      </div>
    </div>
  );
}
