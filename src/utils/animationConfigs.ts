import { gsap } from "gsap";
import { AnimationType } from "./webtoonStorage";

export type OutEffectType = "fade-out" | "slice" | "zoom-out" | "slide-out" | "shutter-out";

export interface AnimationState {
  initial: gsap.TweenVars;
  final: gsap.TweenVars;
  duration: number;
  ease?: string;
}

export interface AnimationConfig {
  scroll: AnimationState;
  play: {
    initial: (container: HTMLElement, isFirst: boolean) => void;
    final: gsap.TweenVars;
    outEffect?: OutEffectType; // Out effect type
  };
  reset: {
    visible: (container: HTMLElement) => void;
    hidden: (container: HTMLElement) => void;
  };
}

// Animation configurations for all animation types
export const ANIMATION_CONFIGS: Record<AnimationType, AnimationConfig> = {
  basic: {
    scroll: {
      initial: { opacity: 0, scale: 1 },
      final: { opacity: 1, scale: 1 },
      duration: 0.5,
      ease: "power2.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, scale: 1, clipPath: "none", y: 0 });
        } else {
          gsap.set(container, { opacity: 0, scale: 1, clipPath: "none", y: 0 });
        }
      },
      final: { opacity: 1, scale: 1 },
      outEffect: "fade-out", // Default out effect
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, scale: 1, y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, scale: 1, clipPath: "none", y: 0 });
      },
    },
  },
  parallax: {
    scroll: {
      initial: { opacity: 0, scale: 0.9 },
      final: { opacity: 1, scale: 1.1 },
      duration: 0.6,
      ease: "power2.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, scale: 1.1, y: 0 });
        } else {
          gsap.set(container, { opacity: 0, scale: 0.9, y: 0 });
        }
      },
      final: { opacity: 1, scale: 1.1 },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, scale: 1.1, y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, scale: 0.9, y: 0 });
      },
    },
  },
  morphing: {
    scroll: {
      initial: { opacity: 0, scale: 0.8, borderRadius: "50%" },
      final: { opacity: 1, scale: 1, borderRadius: "0%" },
      duration: 0.6,
      ease: "power2.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, scale: 1, borderRadius: "0%", y: 0 });
        } else {
          gsap.set(container, { opacity: 0, scale: 0.8, borderRadius: "50%", y: 0 });
        }
      },
      final: { opacity: 1, scale: 1, borderRadius: "0%" },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, scale: 1, borderRadius: "0%", y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, scale: 0.8, borderRadius: "50%", y: 0 });
      },
    },
  },
  "3d-flip": {
    scroll: {
      initial: { opacity: 0, rotationY: -90, transformStyle: "preserve-3d", perspective: "1000px" },
      final: { opacity: 1, rotationY: 0 },
      duration: 0.6,
      ease: "power3.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, rotationY: 0, transformStyle: "preserve-3d", perspective: "1000px", y: 0 });
        } else {
          gsap.set(container, { opacity: 0, rotationY: -90, transformStyle: "preserve-3d", perspective: "1000px", y: 0 });
        }
      },
      final: { opacity: 1, rotationY: 0 },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, rotationY: 0, y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, rotationY: -90, y: 0 });
      },
    },
  },
  physics: {
    scroll: {
      initial: { y: 200, rotation: 180, opacity: 0 },
      final: { opacity: 1, y: 0, rotation: 0 },
      duration: 0.8,
      ease: "elastic.out(1, 0.3)",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, y: 0, rotation: 0 });
        } else {
          gsap.set(container, { opacity: 0, y: 0, rotation: 180 });
        }
      },
      final: { opacity: 1, rotation: 0 },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, y: 0, rotation: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, y: 0, rotation: 180 });
      },
    },
  },
  timeline: {
    scroll: {
      initial: { opacity: 0, scale: 1 },
      final: { opacity: 1, scale: 1 },
      duration: 0.5,
      ease: "power2.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, scale: 1, y: 0 });
        } else {
          gsap.set(container, { opacity: 0, scale: 1, y: "-100vh" });
        }
      },
      final: { opacity: 1, y: 0 },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, scale: 1, y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, scale: 1, y: "-100vh" });
      },
    },
  },
  texture: {
    scroll: {
      initial: { filter: "hue-rotate(360deg)", opacity: 0 },
      final: { opacity: 1, filter: "hue-rotate(0deg)" },
      duration: 0.8,
      ease: "power4.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, filter: "hue-rotate(0deg)", y: 0 });
        } else {
          gsap.set(container, { opacity: 0, filter: "hue-rotate(360deg)", y: 0 });
        }
      },
      final: { opacity: 1, filter: "hue-rotate(0deg)" },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, filter: "hue-rotate(0deg)", y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, filter: "hue-rotate(360deg)", y: 0 });
      },
    },
  },
  "smooth-scroll": {
    scroll: {
      initial: { x: 100, opacity: 0 },
      final: { opacity: 1, x: 0 },
      duration: 0.6,
      ease: "power2.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, x: 0 });
        } else {
          gsap.set(container, { opacity: 0, x: 100, y: 0 });
        }
      },
      final: { opacity: 1, x: 0 },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, x: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, x: 100, y: 0 });
      },
    },
  },
  "blur-fade": {
    scroll: {
      initial: { filter: "blur(100px)", opacity: 0 },
      final: { opacity: 1, filter: "blur(0px)" },
      duration: 0.9,
      ease: "power4.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { opacity: 1, filter: "blur(0px)", clipPath: "none", y: 0 });
        } else {
          gsap.set(container, { opacity: 0, filter: "blur(100px)", y: 0 });
        }
      },
      final: { opacity: 1, filter: "blur(0px)" },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, filter: "blur(0px)", y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, filter: "blur(100px)", y: 0 });
      },
    },
  },
  ripple: {
    scroll: {
      initial: { clipPath: "circle(0% at 50% 50%)", opacity: 0 },
      final: { opacity: 1, clipPath: "circle(150% at 50% 50%)" },
      duration: 1.2,
      ease: "power3.out",
    },
    play: {
      initial: (container, isFirst) => {
        if (isFirst) {
          gsap.set(container, { 
            opacity: 1, 
            clipPath: "none",
            y: 0,
          });
        } else {
          gsap.set(container, { 
            opacity: 0, 
            clipPath: "none",
            y: 0,
          });
        }
      },
      final: { opacity: 1, clipPath: "none" },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, scale: 1, y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { 
          opacity: 0, 
          clipPath: "none",
          y: 0,
        });
      },
    },
  },
  shutter: {
    scroll: {
      initial: { opacity: 0 },
      final: { opacity: 1 },
      duration: 0.5,
      ease: "power3.out",
    },
    play: {
      initial: (container, isFirst) => {
        const strips = container.querySelectorAll('.shutter-strip');
        strips.forEach((strip) => {
          if (isFirst) {
            gsap.set(strip, { yPercent: 100, opacity: 1 });
          } else {
            gsap.set(strip, { yPercent: 100, opacity: 1 });
          }
        });
        if (isFirst) {
          gsap.set(container, { opacity: 1, y: 0 });
        } else {
          gsap.set(container, { opacity: 0, y: 0 });
        }
      },
      final: { opacity: 1 },
      outEffect: "fade-out",
    },
    reset: {
      visible: (container) => {
        const strips = container.querySelectorAll('.shutter-strip');
        strips.forEach((strip) => {
          gsap.set(strip, { yPercent: 0, opacity: 1 });
        });
        gsap.set(container, { opacity: 1, y: 0 });
      },
      hidden: (container) => {
        const strips = container.querySelectorAll('.shutter-strip');
        strips.forEach((strip) => {
          gsap.set(strip, { yPercent: 100, opacity: 1 });
        });
        gsap.set(container, { opacity: 0, y: 0 });
      },
    },
  },
  slice: {
    scroll: {
      initial: { opacity: 0, scale: 1 },
      final: { opacity: 1, scale: 1 },
      duration: 0.5,
      ease: "power2.out",
    },
    play: {
      initial: (container, isFirst) => {
        // Slice effect is only for out effect, in effect uses basic fade
        if (isFirst) {
          gsap.set(container, { opacity: 1, scale: 1, y: 0 });
        } else {
          gsap.set(container, { opacity: 0, scale: 1, y: 0 });
        }
      },
      final: { opacity: 1, scale: 1 },
    },
    reset: {
      visible: (container) => {
        gsap.set(container, { opacity: 1, scale: 1, y: 0 });
      },
      hidden: (container) => {
        gsap.set(container, { opacity: 0, scale: 1, y: 0 });
      },
    },
  },
};

