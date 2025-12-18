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
            
            // For ripple effect, ensure proper initialization
            if (nextCutAnimationType === "ripple") {
              const cutImage = nextCutContainer.querySelector('.cut-image') as HTMLImageElement;
              if (cutImage) {
                // Reset image state completely
                gsap.set(cutImage, {
                  opacity: 0,
                  filter: 'url(#ripple-wave-filter)',
                  scale: 1,
                  transformOrigin: "center center",
                });
                
                // Reset displacement map scale to 50
                const displacementMap = document.querySelector('#ripple-wave-filter feDisplacementMap') as SVGElement;
                if (displacementMap) {
                  displacementMap.setAttribute('scale', '50');
                }
                
                // Ensure container has no clip-path
                gsap.set(nextCutContainer, {
                  clipPath: "none",
                });
              }
            }
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
          // Next cut appears immediately after slice effect starts (no delay)
          const nextCutAnimationPosition = hasSliceExit ? "<" : "<";
          
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
          // Use next cut's own animation type regardless of previous cut's out effect
          if (nextCutAnimationType === "shutter") {
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
          } else if (nextCutAnimationType === "ripple") {
            // Ripple effect: Skip container clip-path animation, only use wave distortion
            // Set container to full visibility without clip-path immediately
            gsap.set(nextCutContainer, {
              opacity: 0,
              clipPath: "none",
            });
          } else {
            // For other animations, check if next cut has slice parts (for exit animation)
            // But next cut itself uses its own animation type
            timeline.to(nextCutContainer, animationProps, nextCutAnimationPosition);
          }
          
          // Ripple effect: Apply wave distortion with fade-in
          if (nextCutAnimationType === "ripple") {
            const cutImage = nextCutContainer.querySelector('.cut-image') as HTMLImageElement;
            if (cutImage) {
              // Create SVG filter for wave distortion if it doesn't exist
              const svgFilter = document.getElementById('ripple-wave-filter');
              if (!svgFilter) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('style', 'position: absolute; width: 0; height: 0; pointer-events: none;');
                svg.innerHTML = `
                  <defs>
                    <filter id="ripple-wave-filter" x="-50%" y="-50%" width="200%" height="200%">
                      <feTurbulence 
                        type="fractalNoise" 
                        baseFrequency="0.01 0.01" 
                        numOctaves="4" 
                        result="noise"
                        seed="2">
                      </feTurbulence>
                      <feDisplacementMap 
                        in="SourceGraphic" 
                        in2="noise" 
                        scale="50" 
                        xChannelSelector="R" 
                        yChannelSelector="G">
                      </feDisplacementMap>
                    </filter>
                  </defs>
                `;
                document.body.appendChild(svg);
              }
              
              // Ensure displacement map is reset to 50 (in case it was used before)
              const displacementMap = document.querySelector('#ripple-wave-filter feDisplacementMap') as SVGElement;
              if (displacementMap) {
                displacementMap.setAttribute('scale', '50');
              }
              
              // Ensure container has no clip-path from the start
              gsap.set(nextCutContainer, {
                clipPath: "none",
              });
              
              // Set initial state: hidden with wave filter at scale 50
              gsap.set(cutImage, {
                opacity: 0,
                filter: 'url(#ripple-wave-filter)',
                scale: 1,
                transformOrigin: "center center",
              });
              
              // Set container to visible immediately (no clip-path animation)
              timeline.set(nextCutContainer, {
                opacity: 1,
                clipPath: "none",
              }, nextCutAnimationPosition);
              
              // Animate wave distortion scale from 50 to 0 with fade-in (simultaneously)
              const waveTimeline = gsap.timeline();
              
              // Fade in image and animate wave distortion simultaneously
              if (displacementMap) {
                // Create animation object for displacement map scale
                const scaleObj = { scale: 90 };
                
                // Animate both opacity and distortion at the same time
                waveTimeline.to(cutImage, {
                  opacity: 1,
                  duration: 1.2,
                  ease: "power2.out",
                });
                
                waveTimeline.to(scaleObj, {
                  scale: 0,
                  duration: 1.2,
                  ease: "power2.out",
                  onUpdate: function() {
                    const scale = this.targets()[0].scale;
                    displacementMap.setAttribute('scale', String(scale));
                  },
                }, "<"); // Start at the same time as opacity animation
              } else {
                // Fallback if displacement map not found
                waveTimeline.to(cutImage, {
                  opacity: 1,
                  duration: 1.2,
                  ease: "power2.out",
                });
              }
              
              // Remove filter after animation
              waveTimeline.set(cutImage, { filter: 'none' });
              
              // Add wave timeline to main timeline
              timeline.add(waveTimeline, nextCutAnimationPosition);
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
        // Create two slice divs that cover the image (top and bottom halves)
        const sliceTop = document.createElement('div');
        const sliceBottom = document.createElement('div');
        
        sliceTop.className = 'slice-part slice-top';
        sliceBottom.className = 'slice-part slice-bottom';
        
        // Calculate relative positions within parent
        const relativeTop = imgRect.top - parentRect.top;
        const relativeLeft = imgRect.left - parentRect.left;
        const sliceHeight = imgRect.height / 2;
        
        // Position slices to cover the image - relative to image parent
        // Top slice
        sliceTop.style.cssText = `
          position: absolute;
          top: ${relativeTop}px;
          left: ${relativeLeft}px;
          width: ${imgRect.width}px;
          height: ${sliceHeight}px;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
        `;
        
        // Bottom slice
        sliceBottom.style.cssText = `
          position: absolute;
          top: ${relativeTop + sliceHeight}px;
          left: ${relativeLeft}px;
          width: ${imgRect.width}px;
          height: ${sliceHeight}px;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
        `;
        
        // Clone image for each slice (already loaded image)
        const imgTop = cutImage.cloneNode(true) as HTMLImageElement;
        const imgBottom = cutImage.cloneNode(true) as HTMLImageElement;
        
        imgTop.style.cssText = `
          width: ${imgRect.width}px;
          height: ${imgRect.height}px;
          object-fit: contain;
          position: absolute;
          left: 0;
          top: 0;
          display: block;
        `;
        
        imgBottom.style.cssText = `
          width: ${imgRect.width}px;
          height: ${imgRect.height}px;
          object-fit: contain;
          position: absolute;
          left: 0;
          top: -${sliceHeight}px;
          display: block;
        `;
        
        sliceTop.appendChild(imgTop);
        sliceBottom.appendChild(imgBottom);
        // Append slices to imageParent
        imageParent.appendChild(sliceTop);
        imageParent.appendChild(sliceBottom);
        
        // Hide original image
        gsap.set(cutImage, { opacity: 0 });
        
        // Don't make container transparent - slices need to be visible
        // Next cut will appear on top due to higher z-index
        
        // Animate slices moving apart vertically
        // Top slice moves up, bottom slice moves down
        // Use shorter duration for slice effect to allow next cut to appear sooner
        const sliceDuration = TRANSITION_DURATION * 0.5; // 0.5 seconds
        timeline.to(
          sliceTop,
          {
            y: "-50%",
            opacity: 0,
            duration: sliceDuration,
            ease: "power3.out",
            onUpdate: function() {
              // Remove slice when opacity is low enough (not visible)
              const opacity = gsap.getProperty(this.targets()[0], "opacity");
              if (this.targets()[0] && typeof opacity === "number" && opacity < 0.1) {
                if (sliceTop.parentElement) {
                  sliceTop.remove();
                }
              }
            },
            onComplete: () => {
              if (sliceTop.parentElement) {
                sliceTop.remove();
              }
            }
          },
          exitAnimationPosition
        );
        
        timeline.to(
          sliceBottom,
          {
            y: "50%",
            opacity: 0,
            duration: sliceDuration,
            ease: "power3.out",
            onUpdate: function() {
              // Remove slice when opacity is low enough (not visible)
              const opacity = gsap.getProperty(this.targets()[0], "opacity");
              if (this.targets()[0] && typeof opacity === "number" && opacity < 0.1) {
                if (sliceBottom.parentElement) {
                  sliceBottom.remove();
                }
              }
            },
            onComplete: () => {
              if (sliceBottom.parentElement) {
                sliceBottom.remove();
              }
            }
          },
          exitAnimationPosition
        );
        
        console.log('Slice out effect: animation added to timeline');
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
  // Use shorter duration to match slice animation duration
  const sliceDuration = TRANSITION_DURATION * 0.00; // 0.00 seconds
  timeline.call(() => {
    gsap.set(currentCutContainer, {
      zIndex: webtoonData.cuts.length - index
    });
  }, [], `+=${sliceDuration}`);
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
          
          // Calculate how the image would be rendered with object-fit: contain (same as regular img)
          const imageAspect = currentImage.naturalWidth / currentImage.naturalHeight;
          const containerAspect = containerRect.width / containerRect.height;
          
          // Calculate actual rendered image size (object-fit: contain logic)
          let renderedWidth: number;
          let renderedHeight: number;
          
          if (imageAspect > containerAspect) {
            // Image is wider - fit to width, height is smaller
            renderedWidth = containerRect.width;
            renderedHeight = renderedWidth / imageAspect;
          } else {
            // Image is taller - fit to height, width is smaller
            renderedHeight = containerRect.height;
            renderedWidth = renderedHeight * imageAspect;
          }
          
          // Each canvas represents 1/stripCount of the RENDERED image width
          const canvasWidth = renderedWidth / stripCount;
          const canvasHeight = renderedHeight;
          const stripWidth = currentImage.naturalWidth / stripCount;
          
          // Calculate rendered image position (centered in container)
          const renderedLeft = (containerRect.width - renderedWidth) / 2;
          const renderedTop = (containerRect.height - renderedHeight) / 2;
          
          // Create canvas strips
          const strips: HTMLCanvasElement[] = [];
          for (let i = 0; i < stripCount; i++) {
            const canvas = document.createElement('canvas');
            canvas.className = 'shutter-out-strip';
            
            const relativeTop = finalTop - parentRect.top;
            const relativeLeft = finalLeft - parentRect.left;
            
            // Calculate strip position - each strip at its exact position within rendered image
            const stripLeft = relativeLeft + renderedLeft + (i * canvasWidth);
            
            // Set canvas size (for high DPI displays)
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvasWidth * dpr;
            canvas.height = canvasHeight * dpr;
            canvas.style.width = `${canvasWidth}px`;
            canvas.style.height = `${canvasHeight}px`;
            
            canvas.style.cssText = `
              position: absolute;
              top: ${relativeTop + renderedTop}px;
              left: ${stripLeft}px;
              width: ${canvasWidth}px;
              height: ${canvasHeight}px;
              pointer-events: none;
              will-change: transform;
              z-index: 10000;
            `;
            
            // Draw the strip portion on canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.scale(dpr, dpr);
              ctx.clearRect(0, 0, canvasWidth, canvasHeight);
              
              // Calculate source rectangle (which part of the image to draw)
              const sourceX = i * stripWidth;
              const sourceY = 0;
              const sourceWidth = stripWidth;
              const sourceHeight = currentImage.naturalHeight;
              
              // Draw the strip portion - each strip shows its portion of the image at rendered size
              ctx.drawImage(
                currentImage,
                sourceX, sourceY, sourceWidth, sourceHeight, // Source: which part of image
                0, 0, canvasWidth, canvasHeight // Destination: fill canvas with rendered size
              );
            }
            
            currentImageParent.appendChild(canvas);
            strips.push(canvas);
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

