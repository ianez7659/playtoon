import { gsap } from "gsap";
import { AnimationType } from "./webtoonStorage";
import { ANIMATION_CONFIGS } from "./animationConfigs";

/**
 * Set initial state for a cut container based on animation type
 */
export function setCutInitialState(
  cutContainer: HTMLElement,
  animationType: AnimationType,
  index: number,
  totalCuts: number,
  isFirst: boolean,
  zIndexBase: number = 1000
): void {
  const config = ANIMATION_CONFIGS[animationType];
  const zIndex = isFirst 
    ? totalCuts + zIndexBase 
    : totalCuts - index + zIndexBase;

  if (isFirst) {
    // First cut: visible state (no animation, already visible)
    if (animationType === "shutter") {
      const strips = cutContainer.querySelectorAll('.shutter-strip');
      strips.forEach((strip) => {
        gsap.set(strip, { yPercent: 0, opacity: 1, immediateRender: true });
      });
      gsap.set(cutContainer, { opacity: 1, y: 0, zIndex, immediateRender: true });
    } else if (animationType === "slice") {
      // Slice: first cut is normal (slice effect is only for exit)
      gsap.set(cutContainer, { opacity: 1, scale: 1, y: 0, zIndex, immediateRender: true });
    } else if (animationType === "ripple") {
      gsap.set(cutContainer, { 
        opacity: 1, 
        clipPath: "none",
        y: 0, 
        zIndex, 
        immediateRender: true 
      });
    } else {
      // First cut: set to final state directly (no animation)
      gsap.set(cutContainer, { ...config.play.final, zIndex, immediateRender: true });
    }
  } else {
    // Other cuts: hidden state
    if (animationType === "shutter") {
      const strips = cutContainer.querySelectorAll('.shutter-strip');
      strips.forEach((strip) => {
        gsap.set(strip, { yPercent: 100, opacity: 1, immediateRender: true });
      });
      gsap.set(cutContainer, { opacity: 0, y: 0, zIndex, immediateRender: true });
    } else if (animationType === "slice") {
      // Slice: other cuts start zoomed out (will zoom in)
      gsap.set(cutContainer, { opacity: 0, scale: 0.5, y: 0, zIndex, immediateRender: true });
    } else if (animationType === "ripple") {
      gsap.set(cutContainer, { 
        opacity: 0, 
        clipPath: "none",
        y: 0, 
        zIndex, 
        immediateRender: true 
      });
    } else if (animationType === "timeline") {
      gsap.set(cutContainer, { opacity: 0, scale: 1, y: "-100vh", zIndex, immediateRender: true });
    } else {
      config.play.initial(cutContainer, false);
      gsap.set(cutContainer, { zIndex, immediateRender: true });
    }
  }
}

/**
 * Get animation props for play mode transition
 */
export function getAnimationProps(animationType: AnimationType): gsap.TweenVars {
  const config = ANIMATION_CONFIGS[animationType];
  const baseProps: gsap.TweenVars = {
    opacity: 1,
    duration: 1,
    ease: "power2.inOut",
  };

  // Special handling for different animation types
  switch (animationType) {
    case "parallax":
      return { ...baseProps, scale: 1.1 };
    case "morphing":
      return { ...baseProps, scale: 1, borderRadius: "0%" };
    case "3d-flip":
      return { ...baseProps, rotationY: 0 };
    case "physics":
      return { ...baseProps, rotation: 0 };
    case "texture":
      return { ...baseProps, filter: "hue-rotate(0deg)" };
    case "blur-fade":
      return { ...baseProps, filter: "blur(0px)" };
    case "ripple":
      return { 
        ...baseProps, 
        clipPath: "none",
        ease: "power3.out",
      };
    case "smooth-scroll":
      return { ...baseProps, x: 0 };
    case "timeline":
      return { ...baseProps, y: 0 };
    case "shutter":
      // Shutter is handled separately
      return baseProps;
    case "slice":
      // Slice: next cut uses zoom in
      return { ...baseProps, scale: 1 };
    default:
      return { ...baseProps, scale: 1 };
  }
}

/**
 * Reset cut to initial state (for resetScroll)
 */
export function resetCutState(
  cutContainer: HTMLElement,
  animationType: AnimationType,
  index: number,
  totalCuts: number,
  zIndexBase: number = 1000
): void {
  const config = ANIMATION_CONFIGS[animationType];
  const isFirst = index === 0;
  const zIndex = isFirst 
    ? totalCuts + zIndexBase 
    : totalCuts - index + zIndexBase;

  if (isFirst) {
    // First cut: visible
    if (animationType === "shutter") {
      const strips = cutContainer.querySelectorAll('.shutter-strip');
      strips.forEach((strip) => {
        gsap.set(strip, { yPercent: 0, opacity: 1 });
      });
      gsap.set(cutContainer, { opacity: 1, y: 0, zIndex });
    } else if (animationType === "slice") {
      // Slice: first cut is normal
      gsap.set(cutContainer, { opacity: 1, scale: 1, y: 0, zIndex });
    } else {
      config.reset.visible(cutContainer);
      gsap.set(cutContainer, { zIndex });
    }
  } else {
    // Other cuts: hidden
    if (animationType === "shutter") {
      const strips = cutContainer.querySelectorAll('.shutter-strip');
      strips.forEach((strip) => {
        gsap.set(strip, { yPercent: 100, opacity: 1 });
      });
      gsap.set(cutContainer, { opacity: 0, y: 0, zIndex });
    } else if (animationType === "slice") {
      const slices = cutContainer.querySelectorAll('.slice-part');
      slices.forEach((slice, index) => {
        const isLeft = index === 0;
        gsap.set(slice, { 
          x: isLeft ? "-100%" : "100%", 
          opacity: 1 
        });
      });
      gsap.set(cutContainer, { opacity: 0, y: 0, zIndex });
    } else if (animationType === "ripple") {
      gsap.set(cutContainer, { 
        opacity: 0, 
        clipPath: "none",
        y: 0, 
        zIndex,
      });
    } else if (animationType === "timeline") {
      gsap.set(cutContainer, { opacity: 0, scale: 1, y: "-100vh", zIndex });
    } else {
      config.reset.hidden(cutContainer);
      gsap.set(cutContainer, { zIndex });
    }
  }
}

