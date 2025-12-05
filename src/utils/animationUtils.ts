import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimationType } from "./webtoonStorage";
import { ANIMATION_CONFIGS } from "./animationConfigs";
import { RefObject } from "react";
import { WebtoonData } from "./webtoonStorage";

/**
 * Create ScrollTrigger configuration for a cut
 */
export function createScrollTriggerConfig(
  cutRef: HTMLDivElement,
  index: number,
  useScrollAnimation: boolean,
  cutRefs: RefObject<(HTMLDivElement | null)[]>,
  webtoonData: WebtoonData,
  cutContainer?: HTMLDivElement
) {
  const container = cutContainer || cutRef.querySelector('.cut-container') as HTMLDivElement;
  
  return {
    scrollTrigger: {
      trigger: cutRef,
      start: "top top",
      end: useScrollAnimation ? "+=100vh" : "bottom top",
      toggleActions: useScrollAnimation ? "none none none none" : "play none none reverse",
      scrub: useScrollAnimation ? true : false,
      pin: useScrollAnimation ? true : false,
      pinSpacing: useScrollAnimation ? true : false,
      once: false,
      immediateRender: false,
      markers: false,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onEnter: () => {
        if (useScrollAnimation) return;
        
        // Hide previous cuts
        for (let i = 0; i < index; i++) {
          const prevSection = cutRefs.current[i];
          if (prevSection) {
            const prevContainer = prevSection.querySelector('.cut-container') as HTMLDivElement;
            if (prevContainer) {
              gsap.to(prevContainer, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                ease: "power2.out",
              });
            }
          }
        }
      },
      onEnterBack: () => {
        // Hide next cuts when scrolling back
        for (let i = index + 1; i < webtoonData.cuts.length; i++) {
          const nextSection = cutRefs.current[i];
          if (nextSection) {
            const nextContainer = nextSection.querySelector('.cut-container') as HTMLDivElement;
            if (nextContainer) {
              gsap.to(nextContainer, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                ease: "power2.out",
              });
            }
          }
        }
      },
      onLeave: () => {
        if (container) {
          gsap.to(container, {
            opacity: 0,
            scale: 0.8,
            duration: 0.2,
            ease: "power2.out",
          });
        }
      },
      onLeaveBack: () => {
        if (container) {
          gsap.to(container, {
            opacity: 0,
            scale: 0.8,
            duration: 0.2,
            ease: "power2.out",
          });
        }
      },
    },
  };
}

/**
 * Create scroll mode animation for a cut
 */
export function createScrollAnimation(
  cutContainer: HTMLElement,
  animationType: AnimationType,
  animationConfig: any
) {
  const config = ANIMATION_CONFIGS[animationType];
  
  // Special handling for shutter and slice
  if (animationType === "shutter") {
    const strips = cutContainer.querySelectorAll('.shutter-strip');
    if (strips.length > 0) {
      gsap.set(cutContainer, { opacity: 1 });
      const tl = gsap.timeline({
        ...animationConfig,
      });
      tl.fromTo(
        strips,
        { yPercent: 100, opacity: 1 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
        }
      );
      return tl;
    } else {
      return gsap.to(cutContainer, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        ...animationConfig,
      });
    }
  }

  if (animationType === "slice") {
    const slices = cutContainer.querySelectorAll('.slice-part');
    if (slices.length > 0) {
      gsap.set(cutContainer, { opacity: 1 });
      const tl = gsap.timeline({
        ...animationConfig,
      });
      // Animate slices spreading apart from center
      tl.fromTo(
        slices,
        { 
          x: 0,
          opacity: 1 
        },
        {
          x: (index) => index === 0 ? "-100%" : "100%",
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        }
      );
      return tl;
    } else {
      return gsap.to(cutContainer, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        ...animationConfig,
      });
    }
  }

  // Use config for standard animations
  return gsap.fromTo(
    cutContainer,
    config.scroll.initial,
    {
      ...config.scroll.final,
      duration: config.scroll.duration,
      ease: config.scroll.ease || "power2.out",
      ...animationConfig,
    }
  );
}

