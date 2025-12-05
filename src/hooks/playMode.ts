import { RefObject } from "react";
import { gsap } from "gsap";
import { AnimationType, WebtoonData } from "@/utils/webtoonStorage";
import { ANIMATION_CONFIGS } from "@/utils/animationConfigs";
import { getAnimationProps, setCutInitialState } from "@/utils/animationHelpers";
import { TRANSITION_DURATION, DEFAULT_CUT_DURATION, ANIMATION_START_DELAY, Z_INDEX_BASE } from "./constants";

interface PlayModeParams {
  webtoonData: WebtoonData;
  cutRefs: RefObject<(HTMLDivElement | null)[]>;
  selectedAnimation: AnimationType;
  useIndividualAnimations: boolean;
  setScrollTween: (tween: gsap.core.Tween | null) => void;
  setIsPlaying: (playing: boolean) => void;
  scrollTweenRef: React.MutableRefObject<gsap.core.Tween | null>;
}

/**
 * Start play mode animation
 * Resets all cuts and starts hold-based scroll animation
 */
export function startPlayModeAnimation({
  webtoonData,
  cutRefs,
  selectedAnimation,
  useIndividualAnimations,
  setScrollTween,
  setIsPlaying,
  scrollTweenRef,
}: PlayModeParams) {
  if (scrollTweenRef.current) {
    scrollTweenRef.current.kill(); // Stop existing animation if any
  }

  setIsPlaying(true);

  // Reset all cuts to initial state
  webtoonData.cuts.forEach((cut, index) => {
    const cutRef = cutRefs.current[index];
    if (cutRef) {
      const cutContainer = cutRef.querySelector('.cut-container') as HTMLDivElement;
      if (cutContainer) {
        const cutAnimationType = useIndividualAnimations
          ? cut?.animationType || "basic"
          : selectedAnimation;
        
        // Set fixed position for all cuts
        gsap.set(cutContainer, {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        });
        
        // Reset to initial state using helper function
        setCutInitialState(
          cutContainer,
          cutAnimationType,
          index,
          webtoonData.cuts.length,
          index === 0,
          1000
        );
      }
    }
  });

  // Start animation after a short delay
  setTimeout(() => {
    startHoldBasedScroll({
      webtoonData,
      cutRefs,
      selectedAnimation,
      useIndividualAnimations,
      setScrollTween,
      setIsPlaying,
      scrollTweenRef,
    });
  }, ANIMATION_START_DELAY);
}

/**
 * Hold-based animation with fixed position layering (no scroll)
 * Each cut is fixed on screen, new cuts slide down from top covering previous ones
 */
function startHoldBasedScroll({
  webtoonData,
  cutRefs,
  selectedAnimation,
  useIndividualAnimations,
  setScrollTween,
  setIsPlaying,
  scrollTweenRef,
}: PlayModeParams) {
  // Create GSAP Timeline
  const timeline = gsap.timeline({
    onComplete: () => {
      setIsPlaying(false);
      setScrollTween(null);
    },
  });

  // Add hold → transition sequence for each cut
  for (let index = 0; index < webtoonData.cuts.length; index++) {
    const cut = webtoonData.cuts[index];
    const holdDuration = cut.duration || DEFAULT_CUT_DURATION;

    // Wait for hold duration (display current cut)
    timeline.to({}, {
      duration: holdDuration,
      ease: "none",
    });

    // Transition to next cut (slide down from top)
    if (index < webtoonData.cuts.length - 1) {
      const nextCutIndex = index + 1;
      const nextCutRef = cutRefs.current[nextCutIndex];
      if (nextCutRef) {
        const nextCutContainer = nextCutRef.querySelector('.cut-container') as HTMLDivElement;
        if (nextCutContainer) {
          // Get the next cut's animation type
          const nextCut = webtoonData.cuts[nextCutIndex];
          const nextCutAnimationType = useIndividualAnimations
            ? nextCut?.animationType || "basic"
            : selectedAnimation;
          
          // Get current cut container for fade out
          const currentCutRef = cutRefs.current[index];
          const currentCutContainer = currentCutRef?.querySelector('.cut-container') as HTMLDivElement;
          
          // Use timeline.call to set up next cut
          timeline.call(() => {
            // Ensure next cut container is fixed positioned
            gsap.set(nextCutContainer, {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            });
            
            // Set higher z-index for new cut to appear on top
            gsap.set(nextCutContainer, { 
              zIndex: webtoonData.cuts.length - nextCutIndex + 1000,
            });
          });
          
          // Animate new cut sliding down from top
          // Use helper function to get animation props
          const animationProps = getAnimationProps(nextCutAnimationType);
          animationProps.duration = TRANSITION_DURATION;
          
          // Add position animation only for smooth-scroll (x-axis) and timeline (y-axis)
          if (nextCutAnimationType === "smooth-scroll") {
            animationProps.x = 0;
          } else if (nextCutAnimationType === "timeline") {
            animationProps.y = 0;
          }
          
          // Determine animation position based on previous cut's out effect
          const currentCut = webtoonData.cuts[index];
          const currentCutAnimationType = useIndividualAnimations
            ? currentCut?.animationType || "basic"
            : selectedAnimation;
          
          // Use saved outEffect from cut data, or fallback to config default
          const currentConfig = ANIMATION_CONFIGS[currentCutAnimationType];
          const outEffect = currentCut?.outEffect || currentConfig.play.outEffect || "fade-out";
          const hasSliceExit = outEffect === "slice";
          const exitAnimationPosition = "<";
          // Next cut appears after slice effect completes (if slice exit exists)
          const nextCutAnimationPosition = hasSliceExit ? `+=${TRANSITION_DURATION}` : "<";
          
          // Animate previous cut exit - use configured out effect
          if (currentCutContainer) {
            handleOutEffect({
              outEffect,
              currentCutContainer,
              currentCutAnimationType,
              timeline,
              exitAnimationPosition,
              webtoonData,
              index,
            });
          }
          
          // Add next cut animation to timeline
          // If previous cut had slice out effect, next cut uses zoom-in
          // Otherwise, use next cut's own animation type
          if (hasSliceExit) {
            // Previous cut had slice out effect - next cut always uses zoom-in
            gsap.set(nextCutContainer, {
              opacity: 0,
              scale: 0.5,
              immediateRender: true
            });
            timeline.to(
              nextCutContainer,
              {
                opacity: 1,
                scale: 1,
                duration: TRANSITION_DURATION,
                ease: "power3.out",
              },
              nextCutAnimationPosition
            );
          } else if (nextCutAnimationType === "shutter") {
            const playStrips = nextCutContainer.querySelectorAll('.shutter-strip');
            if (playStrips.length > 0) {
              // Set initial state: image strips hidden below (yPercent: 100)
              gsap.set(playStrips, { yPercent: 100, opacity: 1, immediateRender: true });
              // Animate strips to reveal image (yPercent: 100 → 0)
              timeline.to(
                playStrips,
                {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.5,
                  stagger: 0.05,
                  ease: "power3.out",
                },
                nextCutAnimationPosition
              );
              // Ensure container is visible
              timeline.set(nextCutContainer, { opacity: 1 }, nextCutAnimationPosition);
            } else {
              timeline.to(nextCutContainer, animationProps, nextCutAnimationPosition);
            }
          } else {
            // For other animations, check if next cut has slice parts (for exit animation)
            // But next cut itself uses its own animation type
            timeline.to(nextCutContainer, animationProps, nextCutAnimationPosition);
          }
          
          // Ripple effect: Create multiple concentric ripple circles with sequential animation
          if (nextCutAnimationType === "ripple") {
            const rippleOverlays = nextCutContainer.querySelectorAll('.ripple-overlay');
            if (rippleOverlays.length > 0) {
              // Calculate screen diagonal for maximum ripple size
              const maxSize = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
              
              rippleOverlays.forEach((ripple, rippleIndex) => {
                const delay = rippleIndex * 0.2; // Stagger delay for each ripple (increased for better visibility)
                
                // Set initial state - ensure it's visible and centered
                gsap.set(ripple, {
                  width: 0,
                  height: 0,
                  opacity: 0.9,
                  scale: 1,
                  x: 0,
                  y: 0,
                  transformOrigin: "center center",
                });
                
                // Animate ripple expansion with fade out
                timeline.to(ripple, {
                  width: maxSize * 2.5,
                  height: maxSize * 2.5,
                  opacity: 0,
                  duration: 1.2,
                  ease: "power2.out",
                }, nextCutAnimationPosition + delay);
              });
            }
          }
        }
      }
    }
  }

  // Store Timeline in ref
  const timelineRef = timeline as unknown as gsap.core.Tween;
  setScrollTween(timelineRef);
  scrollTweenRef.current = timelineRef;
}

/**
 * Handle out effect animations (slice, fade-out, zoom-out, slide-out, shutter-out)
 */
function handleOutEffect({
  outEffect,
  currentCutContainer,
  currentCutAnimationType,
  timeline,
  exitAnimationPosition,
  webtoonData,
  index,
}: {
  outEffect: string;
  currentCutContainer: HTMLDivElement;
  currentCutAnimationType: AnimationType;
  timeline: gsap.core.Timeline;
  exitAnimationPosition: string;
  webtoonData: WebtoonData;
  index: number;
}) {
  if (outEffect === "slice") {
    handleSliceOutEffect(currentCutContainer, timeline, exitAnimationPosition, webtoonData, index);
  } else if (outEffect === "fade-out") {
    timeline.to(currentCutContainer, {
      opacity: 0,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(currentCutContainer, {
          zIndex: webtoonData.cuts.length - index
        });
      }
    }, exitAnimationPosition);
  } else if (outEffect === "zoom-out") {
    timeline.to(currentCutContainer, {
      opacity: 0,
      scale: 0.5,
      duration: TRANSITION_DURATION,
      ease: "power3.out",
      onComplete: () => {
        gsap.set(currentCutContainer, {
          zIndex: webtoonData.cuts.length - index
        });
      }
    }, exitAnimationPosition);
  } else if (outEffect === "slide-out") {
    timeline.to(currentCutContainer, {
      opacity: 0,
      y: "-100vh",
      duration: TRANSITION_DURATION,
      ease: "power3.out",
      onComplete: () => {
        gsap.set(currentCutContainer, {
          zIndex: webtoonData.cuts.length - index
        });
      }
    }, exitAnimationPosition);
  } else if (outEffect === "shutter-out") {
    handleShutterOutEffect(currentCutContainer, currentCutAnimationType, timeline, exitAnimationPosition, webtoonData, index);
  } else {
    // Fallback to fade out for unknown effects
    timeline.to(currentCutContainer, {
      opacity: 0,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(currentCutContainer, {
          zIndex: webtoonData.cuts.length - index
        });
      }
    }, exitAnimationPosition);
  }
}

/**
 * Handle slice out effect
 */
function handleSliceOutEffect(
  currentCutContainer: HTMLDivElement,
  timeline: gsap.core.Timeline,
  exitAnimationPosition: string,
  webtoonData: WebtoonData,
  index: number
) {
  const cutImage = currentCutContainer.querySelector('.cut-image') as HTMLImageElement;
  
  console.log('Slice out effect: checking image', {
    hasImage: !!cutImage,
    complete: cutImage?.complete,
    naturalWidth: cutImage?.naturalWidth,
    naturalHeight: cutImage?.naturalHeight,
    src: cutImage?.src
  });
  
  if (cutImage) {
    const imageParent = cutImage.parentElement;
    
    if (imageParent) {
      // Force a reflow to ensure image is rendered
      void cutImage.offsetWidth;
      
      const imgRect = cutImage.getBoundingClientRect();
      const parentRect = imageParent.getBoundingClientRect();
      
      console.log('Slice: image dimensions', {
        imgWidth: imgRect.width,
        imgHeight: imgRect.height,
        complete: cutImage.complete,
        naturalWidth: cutImage.naturalWidth,
        naturalHeight: cutImage.naturalHeight
      });
      
      if (imgRect.width > 0 && imgRect.height > 0) {
        // Create two slice divs that cover the image
        const sliceLeft = document.createElement('div');
        const sliceRight = document.createElement('div');
        
        sliceLeft.className = 'slice-part slice-left';
        sliceRight.className = 'slice-part slice-right';
        
        // Calculate relative positions within parent
        const relativeTop = imgRect.top - parentRect.top;
        const relativeLeft = imgRect.left - parentRect.left;
        const sliceWidth = imgRect.width / 2;
        
        // Position slices to cover the image - relative to image parent
        sliceLeft.style.cssText = `
          position: absolute;
          top: ${relativeTop}px;
          left: ${relativeLeft}px;
          width: ${sliceWidth}px;
          height: ${imgRect.height}px;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
          z-index: 10000;
        `;
        
        sliceRight.style.cssText = `
          position: absolute;
          top: ${relativeTop}px;
          left: ${relativeLeft + sliceWidth}px;
          width: ${sliceWidth}px;
          height: ${imgRect.height}px;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
          z-index: 10000;
        `;
        
        // Clone image for each slice (already loaded image)
        const imgLeft = cutImage.cloneNode(true) as HTMLImageElement;
        const imgRight = cutImage.cloneNode(true) as HTMLImageElement;
        
        imgLeft.style.cssText = `
          width: ${imgRect.width}px;
          height: ${imgRect.height}px;
          object-fit: contain;
          position: absolute;
          left: 0;
          top: 0;
          display: block;
        `;
        
        imgRight.style.cssText = `
          width: ${imgRect.width}px;
          height: ${imgRect.height}px;
          object-fit: contain;
          position: absolute;
          left: -${sliceWidth}px;
          top: 0;
          display: block;
        `;
        
        sliceLeft.appendChild(imgLeft);
        sliceRight.appendChild(imgRight);
        imageParent.appendChild(sliceLeft);
        imageParent.appendChild(sliceRight);
        
        // Hide original image
        gsap.set(cutImage, { opacity: 0 });
        
        // Animate slices spreading apart
        timeline.to(
          [sliceLeft, sliceRight],
          {
            x: (index) => index === 0 ? "-100%" : "100%",
            opacity: 0,
            duration: TRANSITION_DURATION,
            ease: "power3.out",
            onComplete: () => {
              sliceLeft.remove();
              sliceRight.remove();
            }
          },
          exitAnimationPosition
        );
        
        console.log('Slice: animation added to timeline');
      } else {
        console.warn('Slice: image has no visible dimensions');
      }
    } else {
      console.warn('Slice: image parent not found');
    }
  } else {
    console.warn('Slice: cut-image not found in container');
  }
  
  // Slice effect handles its own fade out, just update z-index after animation
  timeline.call(() => {
    gsap.set(currentCutContainer, {
      zIndex: webtoonData.cuts.length - index
    });
  }, [], `+=${TRANSITION_DURATION}`);
}

/**
 * Handle shutter out effect
 */
function handleShutterOutEffect(
  currentCutContainer: HTMLDivElement,
  currentCutAnimationType: AnimationType,
  timeline: gsap.core.Timeline,
  exitAnimationPosition: string,
  webtoonData: WebtoonData,
  index: number
) {
  // Check if this cut uses shutter animation (has canvas strips) or regular image
  const shutterStrips = currentCutContainer.querySelectorAll('.shutter-strip') as NodeListOf<HTMLCanvasElement>;
  
  // Find image - check both desktop and mobile containers
  let cutImage: HTMLImageElement | null = null;
  
  // Try to find .cut-image class first
  const cutImages = currentCutContainer.querySelectorAll('.cut-image');
  for (let i = 0; i < cutImages.length; i++) {
    const img = cutImages[i] as HTMLImageElement;
    const computedStyle = window.getComputedStyle(img);
    // Check if not hidden by CSS
    if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
      cutImage = img;
      break;
    }
  }
  
  // If not found, search all images
  if (!cutImage) {
    const allImages = currentCutContainer.querySelectorAll('img');
    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i] as HTMLImageElement;
      const computedStyle = window.getComputedStyle(img);
      // Check if visible
      if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
        cutImage = img;
        break;
      }
    }
  }
  
  console.log('Shutter-out effect: checking elements', {
    hasShutterStrips: shutterStrips.length > 0,
    hasImage: !!cutImage,
    stripCount: shutterStrips.length,
    animationType: currentCutAnimationType,
    outEffect: "shutter-out",
    isMobile: window.innerWidth <= 768,
    allImagesCount: currentCutContainer.querySelectorAll('img').length
  });
  
  if (shutterStrips.length > 0) {
    // This cut uses shutter animation - animate existing canvas strips
    console.log('Shutter-out: using existing shutter strips', shutterStrips.length);
    
    timeline.to(
      Array.from(shutterStrips),
      {
        y: (index: number) => index % 2 === 0 ? "-100%" : "100%",
        opacity: 0,
        duration: TRANSITION_DURATION,
        stagger: 0.05,
        ease: "power3.out",
      },
      exitAnimationPosition
    );
    
    console.log('Shutter-out: animation added to timeline (using canvas strips)');
  } else if (cutImage) {
    // Regular image - create horizontal strips (vertical division) for shutter effect
    // Save references to avoid closure issues
    const savedCutImage = cutImage;
    const savedImageParent = cutImage.parentElement;
    
    if (!savedImageParent) {
      console.warn('Shutter-out: image parent not found');
    } else {
      // Use timeline.call to create strips and animate at the right time
      timeline.call(() => {
        // Re-find image in case DOM changed (especially for mobile)
        let currentImage: HTMLImageElement | null = savedCutImage;
        if (!currentImage || !currentImage.parentElement) {
          // Try to find image again
          const cutImages = currentCutContainer.querySelectorAll('.cut-image');
          for (let i = 0; i < cutImages.length; i++) {
            const img = cutImages[i] as HTMLImageElement;
            const computedStyle = window.getComputedStyle(img);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
              currentImage = img;
              break;
            }
          }
          if (!currentImage) {
            const allImages = currentCutContainer.querySelectorAll('img');
            for (let i = 0; i < allImages.length; i++) {
              const img = allImages[i] as HTMLImageElement;
              const computedStyle = window.getComputedStyle(img);
              if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                currentImage = img;
                break;
              }
            }
          }
        }
        
        if (!currentImage) {
          console.warn('Shutter-out: image not found at animation time');
          return;
        }
        
        const currentImageParent = currentImage.parentElement;
        if (!currentImageParent) {
          console.warn('Shutter-out: image parent not found at animation time');
          return;
        }
        
        // Force reflow
        void currentImage.offsetWidth;
        void currentImageParent.offsetWidth;
        
        // Get dimensions
        const imgRect = currentImage.getBoundingClientRect();
        const parentRect = currentImageParent.getBoundingClientRect();
        const imageContainer = currentImage.parentElement;
        
        if (!imageContainer) {
          console.warn('Shutter-out: image container not found');
          return;
        }
        
        const containerRect = imageContainer.getBoundingClientRect();
        
        console.log('Shutter-out: image dimensions (at animation time)', {
          imgWidth: imgRect.width,
          imgHeight: imgRect.height,
          complete: currentImage.complete,
          naturalWidth: currentImage.naturalWidth,
          naturalHeight: currentImage.naturalHeight,
          isMobile: window.innerWidth <= 768,
          containerWidth: containerRect.width,
          containerHeight: containerRect.height
        });
        
        // Check if image is loaded
        const isImageLoaded = currentImage.complete && currentImage.naturalWidth > 0;
        
        if (!isImageLoaded) {
          console.warn('Shutter-out: image not loaded yet at animation time');
          return;
        }
        
        // Calculate final dimensions
        let finalWidth = imgRect.width;
        let finalHeight = imgRect.height;
        let finalTop = imgRect.top;
        let finalLeft = imgRect.left;
        
        // If getBoundingClientRect returns 0, use container and natural dimensions
        if (finalWidth === 0 || finalHeight === 0) {
          const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
          const containerAspectRatio = containerRect.width / containerRect.height;
          
          if (aspectRatio > containerAspectRatio) {
            // Image is wider - fit to width
            finalWidth = containerRect.width;
            finalHeight = containerRect.width / aspectRatio;
          } else {
            // Image is taller - fit to height
            finalHeight = containerRect.height;
            finalWidth = containerRect.height * aspectRatio;
          }
          
          // Center the image
          finalLeft = containerRect.left + (containerRect.width - finalWidth) / 2;
          finalTop = containerRect.top + (containerRect.height - finalHeight) / 2;
        }
        
        // Only proceed if we have valid dimensions
        if (finalWidth > 0 && finalHeight > 0) {
          // Use fewer strips on mobile for better performance
          const stripCount = window.innerWidth <= 768 ? 10 : 15;
          const stripWidth = finalWidth / stripCount;
          // Add small overlap (0.5px) to prevent gaps from sub-pixel rendering
          const overlap = 0.5;
          
          // Create strips with slight overlap to prevent visible gaps
          const strips: HTMLDivElement[] = [];
          for (let i = 0; i < stripCount; i++) {
            const strip = document.createElement('div');
            strip.className = 'shutter-out-strip';
            const relativeTop = finalTop - parentRect.top;
            const relativeLeft = finalLeft - parentRect.left;
            
            // Calculate strip position with slight overlap
            // Each strip starts slightly to the left to overlap with previous
            const stripLeft = relativeLeft + i * stripWidth - (i > 0 ? overlap : 0);
            // Each strip is slightly wider to ensure coverage
            const actualStripWidth = stripWidth + (i > 0 ? overlap : 0) + (i < stripCount - 1 ? overlap : 0);
            
            strip.style.cssText = `
              position: absolute;
              top: ${relativeTop}px;
              left: ${stripLeft}px;
              width: ${actualStripWidth}px;
              height: ${finalHeight}px;
              overflow: hidden;
              pointer-events: none;
              will-change: transform;
              z-index: 10000;
            `;
            
            const imgClone = currentImage.cloneNode(true) as HTMLImageElement;
            const containerRelativeLeft = finalLeft - containerRect.left;
            const containerRelativeTop = finalTop - containerRect.top;
            // Image offset: move image left to show correct strip portion
            // Account for overlap in offset calculation
            const imageOffsetX = containerRelativeLeft - (i * stripWidth) + (i > 0 ? overlap : 0);
            
            // Create wrapper for image clone - same size as container
            const imgWrapper = document.createElement('div');
            imgWrapper.style.cssText = `
              position: absolute;
              top: ${containerRelativeTop}px;
              left: ${imageOffsetX}px;
              width: ${containerRect.width}px;
              height: ${containerRect.height}px;
              pointer-events: none;
            `;
            
            // Image clone maintains original styles
            imgClone.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
            `;
            
            imgWrapper.appendChild(imgClone);
            strip.appendChild(imgWrapper);
            currentImageParent.appendChild(strip);
            strips.push(strip);
          }
          
          // Hide original image
          gsap.set(currentImage, { opacity: 0 });
          
          console.log('Shutter-out: strips created at animation time', { stripCount: strips.length });
          
          // Animate strips immediately after creation
          gsap.to(strips, {
            y: (index: number) => index % 2 === 0 ? "-100%" : "100%",
            opacity: 0,
            duration: TRANSITION_DURATION,
            stagger: 0.05,
            ease: "power3.out",
            onComplete: () => {
              strips.forEach(s => s.remove());
            }
          });
        } else {
          console.warn('Shutter-out: invalid dimensions after calculation', {
            finalWidth,
            finalHeight
          });
        }
      }, [], exitAnimationPosition);
    }
  } else {
    console.warn('Shutter-out: neither shutter strips nor cut-image found in container', {
      container: currentCutContainer,
      allImages: currentCutContainer.querySelectorAll('img'),
      allCanvases: currentCutContainer.querySelectorAll('canvas'),
      animationType: currentCutAnimationType,
      isMobile: window.innerWidth <= 768
    });
  }
  
  // Always fade out container (strips will be on top with higher z-index)
  timeline.to(currentCutContainer, {
    opacity: 0,
    duration: TRANSITION_DURATION,
    ease: "power2.inOut",
    onComplete: () => {
      gsap.set(currentCutContainer, {
        zIndex: webtoonData.cuts.length - index
      });
    }
  }, exitAnimationPosition);
}

