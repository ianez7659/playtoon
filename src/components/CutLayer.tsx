"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import CommandBattle from "./CommandBattle";
import { CutData, AnimationType } from "@/utils/webtoonStorage";

interface CutLayerProps {
  cut: CutData & { type?: 'image' | 'command-battle' };
  index: number;
  totalCuts: number;
  setRef: (el: HTMLDivElement | null) => void;
  isBattleActive: boolean;
  currentBattleCutIndex: number | null;
  onBattleEnd: (winner: { name: string }) => void;
  animationType?: AnimationType;
  isPlaying?: boolean;
  mode?: 'normal' | 'scroll' | 'play';
}

function CutLayer({
  cut,
  index,
  totalCuts,
  setRef,
  isBattleActive,
  currentBattleCutIndex,
  onBattleEnd,
  animationType = "basic",
  isPlaying = false,
  mode = 'normal',
}: CutLayerProps) {
  const cutWithType = { ...cut, type: cut.type || "image" };
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load image and draw strips on canvas for shutter effect
  useEffect(() => {
    if (animationType !== "shutter" || !cutWithType.imageUrl) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    // Remove crossOrigin for local images
    // img.crossOrigin = "anonymous";
    
    img.onload = () => {
      imageRef.current = img;
      
      // Wait for DOM to be ready
      setTimeout(() => {
        if (animationType === "shutter") {
          const stripCount = 15;
          const stripWidth = img.width / stripCount;
          
          // Draw all strips - ensure all 15 strips are drawn
          // First, try to find all canvas elements in the DOM if refs are not ready
          const container = containerRef.current;
          if (container) {
            // Find all shutter-strip canvases in the DOM
            const allStrips = container.querySelectorAll('.shutter-strip') as NodeListOf<HTMLCanvasElement>;
            
            // Update refs with found canvases
            allStrips.forEach((canvas) => {
              const stripIndex = parseInt(canvas.getAttribute('data-strip-index') || '0', 10);
              if (stripIndex >= 0 && stripIndex < 15) {
                canvasRefs.current[stripIndex] = canvas;
              }
            });
          }
          
          // Draw all strips
          for (let stripIndex = 0; stripIndex < 15; stripIndex++) {
            let canvas = canvasRefs.current[stripIndex];
            
            // If canvas ref is null, try to find it in DOM
            if (!canvas && container) {
              canvas = container.querySelector(`canvas[data-strip-index="${stripIndex}"]`) as HTMLCanvasElement;
              if (canvas) {
                canvasRefs.current[stripIndex] = canvas;
              }
            }
            
            if (!canvas) {
              console.warn(`Canvas ${stripIndex} is null`);
              continue;
            }
            
            // Get container - try parent element
            const stripContainer = canvas.parentElement;
            if (!stripContainer) {
              console.warn(`Container for canvas ${stripIndex} is null`);
              continue;
            }
            
            // Wait a bit more if container size is 0
            const containerRect = stripContainer.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) {
              setTimeout(() => {
                const rect = stripContainer.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  drawStrip(canvas, img, stripIndex, stripCount, stripWidth, rect);
                }
              }, 100);
              continue;
            }
            
            drawStrip(canvas, img, stripIndex, stripCount, stripWidth, containerRect);
          }
        }
        // Slice effect is only used for out effect, not in effect
        // No canvas drawing needed for slice in effect
        
        setImageLoaded(true);
      }, 50);
    };
    
    img.onerror = () => {
      console.error("Failed to load image for shutter effect");
      setImageLoaded(false);
    };
    
    img.src = cutWithType.imageUrl;
  }, [animationType, cutWithType.imageUrl]);

  const drawStrip = (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    stripIndex: number,
    stripCount: number,
    stripWidth: number,
    containerRect?: DOMRect
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    const rect = containerRect || container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    // Calculate how the image would be rendered with object-fit: contain (same as regular img)
    const imageAspect = img.width / img.height;
    const containerAspect = rect.width / rect.height;
    
    // Calculate actual rendered image size (object-fit: contain logic)
    let renderedWidth: number;
    let renderedHeight: number;
    
    if (imageAspect > containerAspect) {
      // Image is wider - fit to width, height is smaller
      renderedWidth = rect.width;
      renderedHeight = renderedWidth / imageAspect;
    } else {
      // Image is taller - fit to height, width is smaller
      renderedHeight = rect.height;
      renderedWidth = renderedHeight * imageAspect;
    }
    
    // Each canvas represents 1/stripCount of the RENDERED image width (not container width)
    const canvasWidth = renderedWidth / stripCount;
    const canvasHeight = renderedHeight;
    
    // Set actual canvas size (for high DPI displays)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);
    
    // Clear canvas first
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate source rectangle (which part of the image to draw)
    const sourceX = stripIndex * stripWidth;
    const sourceY = 0;
    const sourceWidth = stripWidth;
    const sourceHeight = img.height;
    
    // Draw the strip portion - each strip shows its portion of the image at rendered size
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight, // Source: which part of image
      0, 0, canvasWidth, canvasHeight // Destination: fill canvas with rendered size
    );
  };

  const drawSlice = (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    sliceIndex: number, // 0 = left, 1 = right
    containerRect: DOMRect
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const sliceCount = 2;
    
    // Each slice is half the container width
    const cssSliceWidth = containerRect.width / sliceCount;
    const cssSliceHeight = containerRect.height;

    // Set canvas internal size
    canvas.width = cssSliceWidth * dpr;
    canvas.height = cssSliceHeight * dpr;
    canvas.style.width = `${cssSliceWidth}px`;
    canvas.style.height = `${cssSliceHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, cssSliceWidth, cssSliceHeight);

    // Calculate source rectangle (which part of the image to draw)
    const sourceX = sliceIndex === 0 ? 0 : img.width / 2;
    const sourceY = 0;
    const sourceWidth = img.width / 2;
    const sourceHeight = img.height;

    // Calculate how the full image would be displayed (maintain aspect ratio like object-fit: contain)
    const imageAspect = img.width / img.height;
    const containerAspect = containerRect.width / containerRect.height;

    let fullDrawWidth, fullDrawHeight, fullDrawY;

    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      fullDrawWidth = containerRect.width;
      fullDrawHeight = fullDrawWidth / imageAspect;
      fullDrawY = (containerRect.height - fullDrawHeight) / 2;
    } else {
      // Image is taller - fit to height
      fullDrawHeight = containerRect.height;
      fullDrawWidth = fullDrawHeight * imageAspect;
      fullDrawY = 0;
    }

    // Calculate this slice's portion of the full drawn image
    const sliceDrawWidth = fullDrawWidth / sliceCount;
    const fullDrawX = (containerRect.width - fullDrawWidth) / 2; // Center the image horizontally
    const sliceDrawX = fullDrawX + (sliceIndex * sliceDrawWidth);

    // Calculate where to draw on this canvas (relative to canvas, not container)
    const canvasLeftInContainer = sliceIndex * cssSliceWidth;
    const drawXOnCanvas = sliceDrawX - canvasLeftInContainer;

    // Draw the slice portion on this canvas
    // The slice should fill the canvas width, so we draw from x=0
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight, // Source: which part of image
      0, fullDrawY, cssSliceWidth, fullDrawHeight // Destination: fill canvas width, maintain height
    );
  };

  // Scroll mode: NO GSAP, just pure CSS - do nothing here

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        setRef(el);
      }}
      className="cut-container"
      style={{
        // Scroll mode: pure CSS, no GSAP interference
        position: mode === 'scroll' ? "relative" : "absolute",
        top: mode === 'scroll' ? "auto" : 0,
        left: mode === 'scroll' ? "auto" : 0,
        right: mode === 'scroll' ? "auto" : 0,
        bottom: mode === 'scroll' ? "auto" : 0,
        zIndex: mode === 'scroll' ? "auto" : (cutWithType.type === "command-battle" ? 9999 : totalCuts - index),
        width: "100%",
        height: mode === 'scroll' ? "auto" : "100%",
        display: mode === 'scroll' ? "block" : "flex",
        alignItems: mode === 'scroll' ? undefined : "center",
        justifyContent: mode === 'scroll' ? undefined : "center",
        backgroundColor: "#000000",
        overflow: "hidden",
        opacity: 1,
        transform: mode === 'scroll' ? "none" : undefined,
        willChange: mode === 'scroll' && index >= totalCuts - 3 ? "auto" : undefined,
      } as React.CSSProperties}
    >
      
      {cutWithType.type === "command-battle" ? (
        <div className="w-full h-full">
          {currentBattleCutIndex === index && isBattleActive ? (
            <CommandBattle
              player1={{
                id: "player1",
                name: "Hero",
                hp: 100,
                maxHp: 100,
                attack: 25,
                defense: 10,
              }}
              player2={{
                id: "player2",
                name: "Enemy",
                hp: 80,
                maxHp: 80,
                attack: 20,
                defense: 8,
              }}
              onBattleStart={() => {}}
              onBattleEnd={onBattleEnd}
            />
          ) : (
            <div className="text-center text-gray-400 bg-gray-800 w-full h-full flex items-center justify-center"></div>
          )}
        </div>
      ) : cutWithType.imageUrl ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: "#000000",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              minHeight: mode === 'scroll' ? "100%" : undefined,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: mode === 'scroll' && isMobile && index === 0 ? "9vh" : undefined,
              willChange: mode === 'scroll' && index >= totalCuts - 3 ? "auto" : undefined,
            }}
          >
            {/* Unified container for both desktop and mobile */}
            <div
              className="flex items-center justify-center"
              style={{
                width: "100%",
                height: "100%",
                minHeight: mode === 'scroll' ? "100%" : undefined,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {animationType === "shutter" && mode !== "scroll" ? (
                // Shutter effect: split image into strips using Canvas
                // Each strip is a canvas element showing only its portion of the image
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((stripIndex) => {
                  // Calculate rendered image size (object-fit: contain) to match regular img
                  const container = containerRef.current;
                  const image = imageRef.current;
                  
                  // If container or image not ready, use default positioning
                  // They will be properly positioned when image loads via useEffect
                  if (!container || !image) {
                    return (
                      <canvas
                        key={`shutter-strip-${stripIndex}`}
                        ref={(el) => {
                          if (el) {
                            canvasRefs.current[stripIndex] = el;
                            // Redraw when canvas is mounted and image is loaded
                            if (imageRef.current && imageLoaded && containerRef.current) {
                              setTimeout(() => {
                                const stripCount = 15;
                                const stripWidth = imageRef.current!.width / stripCount;
                                const rect = containerRef.current!.getBoundingClientRect();
                                drawStrip(el, imageRef.current!, stripIndex, stripCount, stripWidth, rect);
                              }, 10);
                            }
                          } else {
                            canvasRefs.current[stripIndex] = null;
                          }
                        }}
                        className="shutter-strip"
                        data-strip-index={stripIndex}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: `${(stripIndex / 15) * 100}%`,
                          width: `${(100 / 15)}%`,
                          height: "100%",
                          transform: "translateY(-50%) translateZ(0)",
                          pointerEvents: "none",
                          willChange: "transform",
                          backfaceVisibility: "hidden",
                          imageRendering: "crisp-edges",
                        }}
                      />
                    );
                  }
                  
                  const containerRect = container.getBoundingClientRect();
                  const imageAspect = image.width / image.height;
                  const containerAspect = containerRect.width / containerRect.height;
                  
                  let renderedWidth: number;
                  let renderedHeight: number;
                  
                  if (imageAspect > containerAspect) {
                    renderedWidth = containerRect.width;
                    renderedHeight = renderedWidth / imageAspect;
                  } else {
                    renderedHeight = containerRect.height;
                    renderedWidth = renderedHeight * imageAspect;
                  }
                  
                  // Calculate left position: center the rendered image, then position this strip
                  const renderedLeft = (containerRect.width - renderedWidth) / 2;
                  const stripWidth = renderedWidth / 15; // Each strip is 1/15 of rendered width
                  const stripLeft = renderedLeft + (stripIndex * stripWidth);
                  const leftPercent = (stripLeft / containerRect.width) * 100;
                  const widthPercent = (stripWidth / containerRect.width) * 100;
                  
                  return (
                    <canvas
                      key={`shutter-strip-${stripIndex}`}
                      ref={(el) => {
                        if (el) {
                          canvasRefs.current[stripIndex] = el;
                          // Redraw when canvas is mounted
                          if (imageRef.current && imageLoaded && container) {
                            setTimeout(() => {
                              const stripCount = 15;
                              const stripWidth = imageRef.current!.width / stripCount;
                              const rect = container.getBoundingClientRect();
                              drawStrip(el, imageRef.current!, stripIndex, stripCount, stripWidth, rect);
                            }, 10);
                          }
                        } else {
                          canvasRefs.current[stripIndex] = null;
                        }
                      }}
                      className="shutter-strip"
                      data-strip-index={stripIndex}
                      style={{
                        position: "absolute",
                        top: `${((containerRect.height - renderedHeight) / 2) / containerRect.height * 100}%`,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${(renderedHeight / containerRect.height) * 100}%`,
                        transform: "translateZ(0)", // Force hardware acceleration
                        pointerEvents: "none",
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                        imageRendering: "crisp-edges",
                      }}
                    />
                  );
                })
              ) : (
                <img
                  src={cutWithType.imageUrl}
                  alt={`Cut ${index + 1}`}
                  loading={mode === 'scroll' 
                    ? (index >= totalCuts - 3 ? "eager" : "lazy") // Eager load last 3 images
                    : "eager"}
                  decoding="async"
                  style={{
                    width: mode === 'scroll' 
                      ? (isMobile ? "100%" : "auto")
                      : "100%",
                    height: mode === 'scroll'
                      ? (isMobile ? "auto" : "100vh")
                      : "100%",
                    maxWidth: mode === 'scroll' && isMobile ? "100%" : undefined,
                    maxHeight: mode === 'scroll' && !isMobile ? "100vh" : undefined,
                    objectFit: "contain",
                    display: "block",
                    imageRendering: "auto",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                    opacity: 1,
                    aspectRatio: mode === 'scroll' 
                      ? (isMobile ? "9/16" : "4/5") // Apply to all scroll mode images
                      : undefined,
                  }}
                  className="cut-image"
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 bg-gray-800 w-full h-full flex items-center justify-center">
          <p className="text-6xl">Cut {index + 1}</p>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders during scroll
export default React.memo(CutLayer, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.cut.imageUrl === nextProps.cut.imageUrl &&
    prevProps.index === nextProps.index &&
    prevProps.totalCuts === nextProps.totalCuts &&
    prevProps.isBattleActive === nextProps.isBattleActive &&
    prevProps.currentBattleCutIndex === nextProps.currentBattleCutIndex &&
    prevProps.animationType === nextProps.animationType &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.mode === nextProps.mode
  );
});


