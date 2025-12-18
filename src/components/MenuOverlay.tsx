"use client";

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Play, PencilSimple, Trash } from '@phosphor-icons/react';

interface MenuOverlayProps {
  isOpen: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MenuOverlay({ isOpen, onView, onEdit, onDelete }: MenuOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !buttonsRef.current) return;

    if (isOpen) {
      // Menu opening animation
      const buttons = buttonsRef.current.children;
      
      // Set initial state
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(buttons, { opacity: 0, scale: 0, y: 20 });

      // Animate overlay
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Animate buttons sequentially
      gsap.to(buttons, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.25,
        delay: (index) => index * 0.1,
        ease: 'back.out(1.7)',
      });
    } else {
      // Menu closing animation
      const buttons = Array.from(buttonsRef.current.children).reverse(); // Reverse order for closing
      
      // Animate buttons in reverse order (last to first)
      gsap.to(buttons, {
        opacity: 0,
        scale: 0.5,
        y: -10,
        duration: 0.2,
        stagger: 0.08,
        ease: 'power2.in',
      });

      // Animate overlay fade out after buttons start disappearing
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.25,
        delay: 0.15,
        ease: 'power2.in',
      });
    }
  }, [isOpen]);

  // Don't render if never opened (to avoid initial animation)
  const [hasBeenOpen, setHasBeenOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setHasBeenOpen(true);
    }
  }, [isOpen]);

  if (!hasBeenOpen && !isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
      style={{ 
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      <div ref={buttonsRef} className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-2 text-gray-900 border-2 border-gray-900 rounded-full hover:bg-blue-600 hover:text-white hover:border-white transition-colors bg-white bg-opacity-80 backdrop-blur-sm"
          title="View"
        >
          <Play size={16} weight="fill" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-gray-900 rounded-full border-2 border-gray-900 hover:bg-green-600 hover:text-white hover:border-white transition-colors bg-white bg-opacity-80 backdrop-blur-sm"
          title="Edit"
        >
          <PencilSimple size={16} weight="fill" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-gray-900 border-2 border-gray-900 rounded-full hover:bg-red-600 hover:text-white hover:border-white transition-colors bg-white bg-opacity-80 backdrop-blur-sm"
          title="Delete"
        >
          <Trash size={16} weight="fill" />
        </button>
      </div>
    </div>
  );
}

