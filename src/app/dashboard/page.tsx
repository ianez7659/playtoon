"use client";

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/Button';
import CutInputModal from '@/components/CutInputModal';
import WebtoonPage from '@/components/WebtoonPage';
import WebtoonViewer from '@/components/WebtoonViewer';
import CommandBattle from '@/components/CommandBattle';
import { getWebtoons, deleteWebtoon, WebtoonData } from '@/utils/webtoonStorage';
import { MagnifyingGlass, Play, PencilSimple, Trash, Image as ImageIcon, Sword, Plus, DotsThreeVertical, X } from '@phosphor-icons/react';
import { gsap } from 'gsap';

// Menu Overlay Component with Animation
function MenuOverlay({ isOpen, onView, onEdit, onDelete }: { isOpen: boolean; onView: () => void; onEdit: () => void; onDelete: () => void }) {
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

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWebtoon, setCurrentWebtoon] = useState<{ cutCount: number; webtoonId: string } | null>(null);
  const [savedWebtoons, setSavedWebtoons] = useState<WebtoonData[]>([]);
  const [filteredWebtoons, setFilteredWebtoons] = useState<WebtoonData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingWebtoon, setViewingWebtoon] = useState<WebtoonData | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleCreateWebtoon = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleCutConfirm = (cutCount: number) => {
    // Generate UUID v4
    const webtoonId = crypto.randomUUID();
    setCurrentWebtoon({ cutCount, webtoonId });
  };

  const handleBackToDashboard = () => {
    setCurrentWebtoon(null);
    setViewingWebtoon(null);
    setShowBattle(false);
  };

  const handleWebtoonSave = async (webtoonData: WebtoonData) => {
    const webtoons = await getWebtoons();
    setSavedWebtoons(webtoons);
    setCurrentWebtoon(null);
  };

  const handleViewWebtoon = (webtoon: WebtoonData) => {
    setViewingWebtoon(webtoon);
  };

  const handleStartBattle = () => {
    setShowBattle(true);
  };

  const handleBattleEnd = (winner: { name: string }) => {
    setShowBattle(false);
  };

  const handleEditWebtoon = (webtoon: WebtoonData) => {
    setCurrentWebtoon({ cutCount: webtoon.cuts.length, webtoonId: webtoon.id });
  };

  const handleDeleteWebtoon = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this webtoon?')) {
      try {
        await deleteWebtoon(id);
        const webtoons = await getWebtoons();
        setSavedWebtoons(webtoons);
      } catch (error) {
        console.error('Failed to delete webtoon:', error);
        alert('Failed to delete webtoon. Please try again.');
      }
    }
  };

  useEffect(() => {
    const loadWebtoons = async () => {
      try {
        const webtoons = await getWebtoons();
        setSavedWebtoons(webtoons);
        setFilteredWebtoons(webtoons);
      } catch (error) {
        console.error('Failed to load webtoons:', error);
      }
    };
    loadWebtoons();
  }, []);

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWebtoons(savedWebtoons);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = savedWebtoons.filter((webtoon) => {
      return (
        webtoon.title.toLowerCase().includes(query) ||
        webtoon.description.toLowerCase().includes(query)
      );
    });
    setFilteredWebtoons(filtered);
  }, [searchQuery, savedWebtoons]);

  // Show battle component when battle is active
  if (showBattle) {
    const player1 = {
      id: 'player1',
      name: 'Hero',
      hp: 100,
      maxHp: 100,
      attack: 25,
      defense: 10,
      speed: 15
    };

    const player2 = {
      id: 'player2',
      name: 'Enemy',
      hp: 80,
      maxHp: 80,
      attack: 20,
      defense: 8,
      speed: 12
    };

    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        <CommandBattle 
          player1={player1}
          player2={player2}
          onBattleEnd={handleBattleEnd}
        />
      </div>
    );
  }

  // Show webtoon viewer when viewing a webtoon
  if (viewingWebtoon) {
    return (
      <WebtoonViewer 
        webtoonData={viewingWebtoon} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  // Show webtoon editor when creating a new webtoon
  if (currentWebtoon) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        <WebtoonPage 
          cutCount={currentWebtoon.cutCount} 
          webtoonId={currentWebtoon.webtoonId}
          onSave={handleWebtoonSave}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Welcome to the Webtoon Management System</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleStartBattle}
              className="group relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-purple-600 bg-white hover:bg-purple-600 text-purple-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base shadow-md hover:shadow-xl hover:scale-105"
            >
              <Sword size={18} weight="fill" className="transition-transform duration-300 group-hover:rotate-12 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Battle Simulator</span>
            </button>
            <button
              onClick={handleCreateWebtoon}
              className="group relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-green-600 bg-white hover:bg-green-600 text-green-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base shadow-md hover:shadow-xl hover:scale-105"
            >
              <Plus size={18} weight="bold" className="transition-transform duration-300 group-hover:rotate-90 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Create Webtoon</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="relative">
            <MagnifyingGlass 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={20} 
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search webtoons by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Recent webtoons section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Webtoon</h2>
          <div className="bg-white rounded-lg shadow">
            {filteredWebtoons.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? 'No webtoons found matching your search' : 'No webtoons created yet'}
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredWebtoons.map((webtoon) => {
                    // Use thumbnailUrl if available, otherwise use first image cut
                    const thumbnailUrl = webtoon.thumbnailUrl || webtoon.cuts.find(cut => cut.imageUrl && cut.type !== 'command-battle')?.imageUrl;
                    
                    const isMenuOpen = openMenuId === webtoon.id;
                    
                    return (
                      <div 
                        key={webtoon.id} 
                        className="group relative border border-gray-200 rounded-lg overflow-visible bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
                        onClick={() => {
                          // Only navigate on card click if menu is not open
                          if (!isMenuOpen) {
                            handleViewWebtoon(webtoon);
                          }
                        }}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                          {thumbnailUrl ? (
                            <img 
                              src={thumbnailUrl} 
                              alt={webtoon.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <ImageIcon size={48} className="text-gray-400" weight="thin" />
                            </div>
                          )}
                          
                          {/* Menu Button - Top Right (All devices) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : webtoon.id);
                            }}
                            className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                            aria-label="Menu"
                          >
                            {isMenuOpen ? (
                              <X size={18} weight="bold" className="text-gray-900" />
                            ) : (
                              <DotsThreeVertical size={18} weight="bold" className="text-gray-900" />
                            )}
                          </button>
                          
                          {/* Overlay Menu - appears when menu button is clicked (All devices) */}
                          <MenuOverlay 
                            isOpen={isMenuOpen}
                            onView={() => {
                              setOpenMenuId(null);
                              handleViewWebtoon(webtoon);
                            }}
                            onEdit={() => {
                              setOpenMenuId(null);
                              handleEditWebtoon(webtoon);
                            }}
                            onDelete={() => {
                              setOpenMenuId(null);
                              handleDeleteWebtoon(webtoon.id);
                            }}
                          />
                        </div>
                        
                        {/* Card Footer */}
                        <div className="p-3 bg-white">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{webtoon.title}</h3>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{webtoon.cuts.length} cuts</span>
                            <span>{new Date(webtoon.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Cut input modal */}
      <CutInputModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleCutConfirm}
      />
    </div>
  );
}
