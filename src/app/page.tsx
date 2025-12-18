"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function Home() {
  const halftoneRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const featuresGridRef = useRef<HTMLDivElement>(null);
  const additionalInfoRef = useRef<HTMLParagraphElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [titleChars, setTitleChars] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Split title into characters for sequential animation
    setTitleChars("Playtoon".split(""));
    
  }, []);

  useEffect(() => {
    if (!isMounted || titleChars.length === 0) return;

    // Set initial state immediately to hide all content before animation
    // Logo: simple fade in (no scale, no blur, NO typing effect)
    if (logoRef.current) {
      // Ensure logo starts hidden - ONLY opacity, NO other transforms
      gsap.set(logoRef.current, { 
        opacity: 0,
        scale: 2.0,
        filter: "blur(10px)",
      });
    }
    // Text: typing effect (with scale and blur)
    if (titleRef.current) {
      const chars = titleRef.current.querySelectorAll(".char");
      chars.forEach((char) => {
        gsap.set(char, {
          opacity: 0,
          scale: 1.5,
          filter: "blur(10px)",
        });
      });
    }
    if (descriptionRef.current) {
      gsap.set(descriptionRef.current, { opacity: 0, y: 20 });
    }
    if (ctaRef.current) {
      gsap.set(ctaRef.current, { 
        opacity: 0, 
        y: 20, 
        scale: 0.9,
        filter: "blur(5px)",
      });
    }
    if (featuresGridRef.current) {
      const featureCards = featuresGridRef.current.querySelectorAll("div > div");
      featureCards.forEach((card) => {
        gsap.set(card, { 
          opacity: 0, 
          y: 30,
          scale: 0.95,
        });
      });
    }
    if (additionalInfoRef.current) {
      gsap.set(additionalInfoRef.current, { opacity: 0, y: 20 });
    }

    // Sequential entrance animation
    const tl = gsap.timeline({ delay: 0.5 });

    // 1. Logo fade in (FIRST - simple fade in only, NO typing effect)
    if (logoRef.current) {
      // Simple fade in - ONLY opacity change
      tl.to(logoRef.current, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.0,
        ease: "power2.out",
      });
      
      // Wait after logo appears before starting text animation
      tl.to({}, { duration: 0.5 });
    }

    // 2. Title sequential character animation (AFTER logo appears - typing effect)
    if (titleRef.current) {
      const chars = titleRef.current.querySelectorAll(".char");
      
      // Ensure text characters have typing effect initial state (re-set to be sure)
      chars.forEach((char) => {
        gsap.set(char, {
          opacity: 0,
          scale: 1.5,
          filter: "blur(10px)",
        });
      });
      
      // Animate each character sequentially (typing effect)
      // Start AFTER logo animation and wait time
      // First character starts after logo + wait, then each subsequent character starts 0.1s after previous START
      chars.forEach((char, index) => {
        if (index === 0) {
          // First character: start after logo + wait
          tl.to(char, {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "back.out(1.7)",
          }, ">");
        } else {
          // Subsequent characters: start 0.1s after previous character START
          // Use "<0.4" to start 0.4s before previous animation ends (0.5 duration - 0.4 = 0.1s gap)
          tl.to(char, {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "back.out(1.7)",
          }, "<0.1");
        }
      });

      // Add glow effect and change text color to gradient after ALL characters have appeared
      // Use ">" to start after the last character animation
      // First, change each character color from white to gradient (fast)
      chars.forEach((char) => {
        const color = char.getAttribute('data-color');
        if (color) {
          tl.to(char, {
            color: color,
            duration: 0.01,
            ease: "power2.out",
          }, ">0.01");
        }
      });
      
      // Then add glow effect
      tl.to(titleRef.current, {
        filter: "drop-shadow(0 0 10px rgba(147, 51, 234, 0.8)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 30px rgba(236, 72, 153, 0.4))",
        duration: 0.8,
        ease: "power2.out",
      }, "<"); // Start at the same time as color change
    }

    // 3. Background animations (halftone + SVG) - after text glow
    if (halftoneRef.current) {
      gsap.set(halftoneRef.current, { opacity: 0 });
      
      // Fade in after text glow
      tl.to(halftoneRef.current, {
        opacity: 0.5,
        duration: 1,
        ease: "power2.out",
      }, ">"); // Start after text glow

      // Continuous background position animation (no opacity change)
      gsap.to(halftoneRef.current, {
        backgroundPosition: "100px 100px",
        duration: 30,
        repeat: -1,
        ease: "none",
      });
    }


    // 4. All remaining elements fade in together (after background animation)
    // Description
    if (descriptionRef.current) {
      tl.to(descriptionRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }, ">"); // Start after background animation
    }

    // CTA button
    if (ctaRef.current) {
      tl.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px) drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))",
        duration: 0.8,
        ease: "back.out(1.7)",
      }, "<"); // Start at the same time as description
    }

    // Features Grid
    if (featuresGridRef.current) {
      const featureCards = featuresGridRef.current.querySelectorAll("div > div");
      tl.to(featureCards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
      }, "<"); // Start at the same time as description and button
    }

    // Additional Info
    if (additionalInfoRef.current) {
      tl.to(additionalInfoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }, "<"); // Start at the same time as all other elements
    }
  }, [isMounted, titleChars]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Halftone Pattern Background */}
      <div
        ref={halftoneRef}
        className="absolute inset-0"
        style={{
          backgroundImage: `
           
            radial-gradient(circle, rgba(96, 165, 250, 0.4) 5px, transparent 2px),
            radial-gradient(circle, rgba(147, 51, 234, 0.4) 5px, transparent 2px)
          `,
          backgroundSize: "30px 30px, 60px 60px",
          backgroundPosition: "0 0, 15px 15px",
          opacity: 0,
        }}
      />


      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title with sequential characters */}
          <h1 
            ref={titleRef}
            className="text-6xl md:text-8xl font-bold mb-6 flex items-center justify-center relative"
            style={{
              filter: "drop-shadow(0 0 10px rgba(147, 51, 234, 0.5)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))",
            }}
          >
            {/* Play symbol - fixed on the left of text */}
            <span 
              ref={logoRef}
              className="inline-flex items-center flex-shrink-0"
              style={{ 
                opacity: 0, // Hide initially to prevent flash before animation
                marginRight: '12px',
              }}
            >
              <span
                className="w-12 h-12 md:w-16 md:h-16 inline-block"
                style={{
                  background: 'white',
                  clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6))',
                }}
              />
            </span>
            {titleChars.map((char, index) => {
              // Create gradient colors for each character
              const gradientColors = [
                "#60a5fa", // blue-400
                "#9333ea", // purple-500
                "#ec4899", // pink-500
                "#9333ea", // purple-500
                "#60a5fa", // blue-400
                "#ec4899", // pink-500
                "#9333ea", // purple-500
                "#60a5fa", // blue-400
              ];
              const color = gradientColors[index % gradientColors.length];
              
              return (
                <span
                  key={index}
                  className="char inline-block"
                  style={{
                    color: char === " " ? "transparent" : "white", // Start with white during typing
                    opacity: 0, // Each character starts hidden
                    WebkitTextStroke: char === " " ? "none" : "3px black",
                    paintOrder: "stroke fill",
                  } as React.CSSProperties}
                  data-color={color} // Store gradient color for later use
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              );
            })}
          </h1>

          {/* Description */}
          <p 
            ref={descriptionRef}
            className="text-xl md:text-3xl font-bold text-gray-300 mb-8"
            style={{ opacity: 0 }}
          >
            Playtoon is a webtoon viewer platform with immersive animations and multiple viewing modes
          </p>
          
          {/* CTA Button */}
          <Link
            ref={ctaRef}
            href="/dashboard"
            className="inline-block px-10 py-5 bg-orange-500 rounded-3xl font-bold text-3xl text-white border-4 border-white shadow-[0_8px_0_0_rgba(0,0,0,0.8),0_12px_20px_rgba(0,0,0,0.6)] hover:bg-orange-600 hover:shadow-[0_4px_0_0_rgba(0,0,0,0.8),0_8px_16px_rgba(0,0,0,0.6)] hover:translate-y-1 active:translate-y-2 active:shadow-[0_2px_0_0_rgba(0,0,0,0.8)] transition-all duration-200 ease-out transform hover:scale-105"
            style={{ opacity: 0 }}
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Features Grid */}
        <div ref={featuresGridRef} className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Viewing Modes */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 border-4 border-white shadow-[0_8px_0_0_rgba(0,0,0,0.3),0_12px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-1 transition-all duration-200 ease-out transform hover:scale-105" style={{ opacity: 0 }}>
            <h3 className="text-3xl font-bold mb-6 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">Viewing Modes</h3>
            <ul className="space-y-3 text-white font-semibold text-lg">
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• Normal Mode</li>
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• Scroll Mode</li>
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• Play Mode</li>
            </ul>
          </div>

          {/* Animation Effects */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 border-4 border-white shadow-[0_8px_0_0_rgba(0,0,0,0.3),0_12px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-1 transition-all duration-200 ease-out transform hover:scale-105" style={{ opacity: 0 }}>
            <h3 className="text-3xl font-bold mb-6 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">Animation Effects</h3>
            <ul className="space-y-3 text-white font-semibold text-lg">
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• 11+ In Effects</li>
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• 5 Out Effects</li>
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• GSAP Powered</li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-8 border-4 border-white shadow-[0_8px_0_0_rgba(0,0,0,0.3),0_12px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-1 transition-all duration-200 ease-out transform hover:scale-105" style={{ opacity: 0 }}>
            <h3 className="text-3xl font-bold mb-6 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">Tech Stack</h3>
            <ul className="space-y-3 text-white font-semibold text-lg">
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• Next.js 15</li>
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• TypeScript</li>
              <li className="drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">• Supabase</li>
            </ul>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <p ref={additionalInfoRef} className="text-gray-400 text-lg" style={{ opacity: 0 }}>
            Create, edit, and view webtoons with smooth animations and interactive features.
            Built with modern web technologies for the best viewing experience.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
