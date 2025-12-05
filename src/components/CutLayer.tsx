"use client";

import React, { useRef, useEffect, useState } from "react";
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
}

export default function CutLayer({
  cut,
  index,
  totalCuts,
  setRef,
  isBattleActive,
  currentBattleCutIndex,
  onBattleEnd,
  animationType = "basic",
  isPlaying = false,
}: CutLayerProps) {
  const cutWithType = { ...cut, type: cut.type || "image" };
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
          
          // Draw all strips
          canvasRefs.current.forEach((canvas, stripIndex) => {
            if (!canvas) {
              console.warn(`Canvas ${stripIndex} is null`);
              return;
            }
            
            // Get container - try parent element
            const container = canvas.parentElement;
            if (!container) {
              console.warn(`Container for canvas ${stripIndex} is null`);
              return;
            }
            
            // Wait a bit more if container size is 0
            const containerRect = container.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) {
              setTimeout(() => {
                const rect = container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  drawStrip(canvas, img, stripIndex, stripCount, stripWidth, rect);
                }
              }, 100);
              return;
            }
            
            drawStrip(canvas, img, stripIndex, stripCount, stripWidth, containerRect);
          });
        } else if (animationType === "slice") {
          // Draw two slices (left and right)
          canvasRefs.current.forEach((canvas, sliceIndex) => {
            if (!canvas) {
              console.warn(`Canvas ${sliceIndex} is null`);
              return;
            }
            
            const container = canvas.parentElement;
            if (!container) {
              console.warn(`Container for canvas ${sliceIndex} is null`);
              return;
            }
            
            const containerRect = container.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) {
              setTimeout(() => {
                const rect = container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  drawSlice(canvas, img, sliceIndex, rect);
                }
              }, 100);
              return;
            }
            
            drawSlice(canvas, img, sliceIndex, containerRect);
          });
        }
        
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
    
    // Each canvas represents 1/stripCount of the container width
    const canvasWidth = rect.width / stripCount;
    const canvasHeight = rect.height;
    
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
    
    // Calculate how the full image would be displayed (maintain aspect ratio like object-fit: contain)
    const imageAspect = img.width / img.height;
    const containerAspect = rect.width / rect.height;
    
    let fullDrawWidth, fullDrawHeight, fullDrawY;
    
    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      fullDrawWidth = rect.width;
      fullDrawHeight = fullDrawWidth / imageAspect;
      fullDrawY = (rect.height - fullDrawHeight) / 2;
    } else {
      // Image is taller - fit to height
      fullDrawHeight = rect.height;
      fullDrawWidth = fullDrawHeight * imageAspect;
      fullDrawY = 0;
    }
    
    // Calculate this strip's portion of the full drawn image
    const stripDrawWidth = fullDrawWidth / stripCount;
    const fullDrawX = (rect.width - fullDrawWidth) / 2; // Center the image horizontally
    const stripDrawX = fullDrawX + (stripIndex * stripDrawWidth);
    
    // Calculate where to draw on this canvas (relative to canvas, not container)
    const canvasLeftInContainer = stripIndex * canvasWidth;
    const drawXOnCanvas = stripDrawX - canvasLeftInContainer;
    
    // Draw the strip portion on this canvas
    // The strip should fill the canvas width, so we draw from x=0
    // Calculate the scale factor to fit the image in the container
    const scaleX = fullDrawWidth / img.width;
    const scaleY = fullDrawHeight / img.height;
    
    // Draw the strip portion, scaled to fit the canvas
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight, // Source: which part of image
      0, fullDrawY, canvasWidth, fullDrawHeight // Destination: fill canvas width, maintain height
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

  return (
    <div
      ref={setRef}
      className="cut-container"
      style={{
        position: "absolute", // Will be overridden to "fixed" in play mode by GSAP
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex:
          cutWithType.type === "command-battle" ? 9999 : totalCuts - index,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
        overflow: "hidden",
      }}
    >
      {/* Ripple effect overlays - multiple concentric circles (at cut-container level) */}
      {[0, 1, 2].map((rippleIndex) => (
        <div
          key={rippleIndex}
          className="ripple-overlay"
          data-ripple-index={rippleIndex}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "0px",
            height: "0px",
            borderRadius: "50%",
            border: "4px solid rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            opacity: 0,
            zIndex: 10000 + rippleIndex, // Very high z-index to appear above everything
          }}
        />
      ))}
      
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
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Unified container for both desktop and mobile */}
            <div
              className="flex items-center justify-center"
              style={{
                width: "100%",
                maxWidth: "800px",
                aspectRatio: "4/5",
                maxHeight: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {animationType === "shutter" ? (
                // Shutter effect: split image into strips using Canvas
                // Each strip is a canvas element showing only its portion of the image
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((stripIndex) => {
                  const stripWidth = 100 / 15; // Each strip is 1/15 of the width
                  const leftPercent = stripIndex * stripWidth;
                  
                  return (
                    <canvas
                      key={`shutter-strip-${stripIndex}`}
                      ref={(el) => {
                        if (el) {
                          canvasRefs.current[stripIndex] = el;
                          // Redraw when canvas is mounted
                          if (imageRef.current && imageLoaded) {
                            setTimeout(() => {
                              const stripCount = 15;
                              const stripWidth = imageRef.current!.width / stripCount;
                              drawStrip(el, imageRef.current!, stripIndex, stripCount, stripWidth);
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
                        top: 0,
                        left: `${leftPercent}%`,
                        width: `${stripWidth}%`,
                        height: "100%",
                        pointerEvents: "none",
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                        transform: "translateZ(0)", // Force hardware acceleration
                        imageRendering: "crisp-edges",
                      }}
                    />
                  );
                })
              ) : animationType === "slice" ? (
                // Slice effect: split image into two parts (left and right) using Canvas
                [0, 1].map((sliceIndex) => {
                  const sliceWidth = 50; // Each slice is 50% of the width
                  const leftPercent = sliceIndex * sliceWidth;
                  
                  return (
                    <canvas
                      key={`slice-part-${sliceIndex}`}
                      ref={(el) => {
                        if (el) {
                          canvasRefs.current[sliceIndex] = el;
                          // Redraw when canvas is mounted
                          if (imageRef.current && imageLoaded) {
                            setTimeout(() => {
                              const container = el.parentElement;
                              if (container) {
                                const rect = container.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                  drawSlice(el, imageRef.current!, sliceIndex, rect);
                                }
                              }
                            }, 10);
                          }
                        } else {
                          canvasRefs.current[sliceIndex] = null;
                        }
                      }}
                      className="slice-part"
                      data-slice-index={sliceIndex}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: `${leftPercent}%`,
                        width: `${sliceWidth}%`,
                        height: "100%",
                        pointerEvents: "none",
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                        transform: "translateZ(0)", // Force hardware acceleration
                        imageRendering: "crisp-edges",
                      }}
                    />
                  );
                })
              ) : (
                <img
                  src={cutWithType.imageUrl}
                  alt={`Cut ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
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


