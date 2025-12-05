"use client";

import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';

interface Player {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

interface BattleAction {
  type: 'attack' | 'defend' | 'special' | 'item';
  name: string;
  damage?: number;
  healing?: number;
  description: string;
}

interface BattleLog {
  id: string;
  player: string;
  action: string;
  damage?: number;
  healing?: number;
  timestamp: Date;
}

interface CommandBattleProps {
  player1: Player;
  player2: Player;
  onBattleStart?: () => void;
  onBattleEnd?: (winner: Player) => void;
}

// EncounterPortal component
function EncounterPortal({ onEncounter }: { onEncounter: () => void }) {
  const [showPortal, setShowPortal] = useState(false);

  useEffect(() => {
    // Portal appearance animation
    setShowPortal(true);
    
    // Start battle after 2 seconds
    const timer = setTimeout(() => {
      onEncounter();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onEncounter]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className={`text-center transition-all duration-1000 ${showPortal ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="text-6xl mb-4 animate-pulse">⚔️</div>
        <h2 className="text-3xl font-bold text-white mb-2">ENCOUNTER!</h2>
        <p className="text-xl text-gray-300">Battle begins...</p>
      </div>
    </div>
  );
}

// Actual CommandBattle component
function BattleComponent({ player1, player2, onBattleStart, onBattleEnd }: CommandBattleProps) {
  const [currentPlayer, setCurrentPlayer] = useState<Player>(player1);
  const [players, setPlayers] = useState<Player[]>([player1, player2]);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battlePhase, setBattlePhase] = useState<'preparation' | 'battle' | 'ended'>('preparation');
  const [winner, setWinner] = useState<Player | null>(null);
  const [showBattleOverlay, setShowBattleOverlay] = useState(false);
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [showPlayerCommands, setShowPlayerCommands] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [enemyDefeated, setEnemyDefeated] = useState(false);

  const battleActions: BattleAction[] = [
    { type: 'attack', name: 'Attack', damage: 20, description: 'Basic attack' },
    { type: 'defend', name: 'Defend', description: 'Reduce incoming damage' },
    { type: 'special', name: 'Special', damage: 35, description: 'Powerful special attack' },
    { type: 'item', name: 'Heal', healing: 25, description: 'Restore HP' }
  ];

  const addToBattleLog = (log: Omit<BattleLog, 'id' | 'timestamp'>) => {
    const newLog: BattleLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setBattleLog(prev => [...prev, newLog]);
  };

  const addMessageToQueue = (message: string) => {
    setMessageQueue(prev => [...prev, message]);
  };

  const typeMessage = (message: string) => {
    setIsTyping(true);
    setCurrentMessage('');
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < message.length) {
        setCurrentMessage(message.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 10); 
  };

  const playSound = (soundType: 'attack' | 'hit' | 'defeat') => {
    // Sound implementation would go here
    console.log(`Playing ${soundType} sound`);
  };


  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, ...updates } : player
    ));
  };

  const calculateDamage = (attacker: Player, defender: Player, action: BattleAction): number => {
    if (action.type === 'defend') return 0;
    
    const baseDamage = action.damage || attacker.attack;
    const defense = defender.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    return damage;
  };

  const executeAction = (action: BattleAction) => {
    if (battlePhase !== 'battle') return;

    const attacker = currentPlayer;
    const defender = players.find(p => p.id !== attacker.id)!;

    let damage = 0;
    let healing = 0;
    let message = '';

    // Show battle header with action name
    const battleHeader = document.querySelector('.bg-black\\/50.border-2.border-yellow-400') as HTMLElement;
    const battleHeaderText = document.getElementById('battle-header-text') as HTMLElement;
    if (battleHeader && battleHeaderText) {
      battleHeader.style.visibility = 'visible';
      battleHeaderText.textContent = action.name;
    }

    if (action.type === 'attack' || action.type === 'special') {
      damage = calculateDamage(attacker, defender, action);
      updatePlayer(defender.id, { hp: Math.max(0, defender.hp - damage) });
      message = `${attacker.name} attacks for ${damage} damage!`;
      
      // Play attack sound
      playSound('attack');
      
      // Shake animation based on attacker
      if (attacker.id === player1.id) {
        // Enemy shake animation when player attacks enemy
        gsap.timeline()
          .to(".enemy-image", { x: 100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: -100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: 100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: -100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: 100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: -100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: 100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: -100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: 100, duration: 0.05, ease: "power2.inOut" })
          .to(".enemy-image", { x: 0, duration: 0.05, ease: "power2.inOut" });
      } else {
        // Bottom area shake animation when enemy attacks player
        gsap.timeline()
          .to(".battle-commands", { y: 10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: -10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: 10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: -10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: 10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: -10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: 10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: -10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: 10, duration: 0.05, ease: "power2.inOut" })
          .to(".battle-commands", { y: 0, duration: 0.05, ease: "power2.inOut" });
      }
    } else if (action.type === 'item') {
      healing = action.healing || 0;
      updatePlayer(attacker.id, { 
        hp: Math.min(attacker.maxHp, attacker.hp + healing) 
      });
      message = `${attacker.name} heals for ${healing} HP!`;
    } else if (action.type === 'defend') {
      message = `${attacker.name} defends!`;
    }

    // Add message to queue
    addMessageToQueue(message);

    // Hide battle header after action
    setTimeout(() => {
      if (battleHeader) {
        battleHeader.style.visibility = 'hidden';
      }
    }, 1000);

    // Check for battle end
    const updatedDefender = { ...defender, hp: Math.max(0, defender.hp - damage) };
    if (updatedDefender.hp <= 0) {
      setWinner(attacker);
      setBattlePhase('ended');
      playSound('defeat');
      addMessageToQueue(`${defender.name} has been defeated!`);
      
      // Start enemy defeat animation
      setEnemyDefeated(true);
      
      // Add to battle log
      addToBattleLog({
        player: attacker.name,
        action: `${attacker.name} wins the battle!`
      });
      
      // Show victory screen after enemy defeat animation
      setTimeout(() => {
        addMessageToQueue(`${attacker.name} wins the battle!`);
        endBattle('victory');
      }, 3000); // 3 second delay for defeat animation (1s shake + 1s fade + 1s buffer)
      
      return;
    }

    // Switch turns
    setCurrentPlayer(defender);
    setIsPlayerTurn(false);
  };

  const endBattle = (result: 'victory' | 'defeat') => {
    setBattleResult(result);
    setShowBattleOverlay(true);
    
    // Dynamic victory animation - wait for DOM rendering
    if (result === 'victory') {
      setTimeout(() => {
        // Overlay backdrop animation
        gsap.fromTo(".overlay-backdrop", 
          { backdropFilter: "blur(0px)" },
          { backdropFilter: "blur(10px)", duration: 0.5, ease: "power2.out" }
        );
        
        // Victory container animation
        gsap.to(".victory-container", {
          opacity: 1,
          scale: 1.9,
          
          filter: "blur(0px)",
          duration: 0.8,
          ease: "back.out(1.7)"
        });
        
        // Victory text animation
        gsap.to(".victory-text", {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "back.out(1.7)",
          delay: 0.2
        });
        
        // Continue text animation
        gsap.to(".continue-text", {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power2.out",
          delay: 0.8
        });
        
        // Victory text pulse effect
        gsap.to(".victory-text", {
          scale: 1.0,
          duration: 0.3,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.5
        });
        
        // Continue text blinking effect
        gsap.to(".continue-text", {
          opacity: 0.3,
          duration: 0.8,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.5
        });
      }, 100); // 100ms delay for DOM rendering
    }
  };

  const startBattle = () => {
    setIsAnimating(true);
    
    // Battle start animation
    gsap.fromTo(".battle-container", 
      { 
        opacity: 0
      },
      { 
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
          setIsAnimating(false);
          setBattlePhase('battle');
          addMessageToQueue('Enemy appeared!');
          
          // Step 1: Center image appears
          gsap.fromTo(".enemy-image", 
            { 
              opacity: 0,
              scale: 1.6,
              filter: "brightness(0) contrast(0) saturate(0)"
            },
            { 
              opacity: 1,
              scale: 1.5,
              filter: "brightness(1) contrast(1) saturate(1)",
              duration: 0.5, 
              ease: "none",
              delay: 0.5
            }
          );
          
          // Step 2: Left/right sidebar animation (after image completes)
          gsap.to(".player-sidebar", { 
            opacity: 1, 
            x: 0, 
            duration: 0.5, 
            ease: "power2.out",
            delay: 1.5
          });
          
          gsap.to(".enemy-sidebar", { 
            opacity: 1, 
            x: 0, 
            duration: 0.5, 
            ease: "power2.out",
            delay: 1.5
          });
          
          
          // Step 3: Commands appear (after sidebar completes)
          gsap.to(".battle-commands", { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            ease: "power2.out",
            delay: 1.5
          });
          
          // Step 4: Player commands appear (after commands complete)
          setTimeout(() => {
            setShowPlayerCommands(true);
            addMessageToQueue('What will you do?');
            
            // Execute animation after DOM rendering
            setTimeout(() => {
              // Set initial state
              gsap.set(".player-commands", { opacity: 0 });
              
              // Player commands animation
              gsap.to(".player-commands", { 
                opacity: 1, 
                duration: 0.6, 
                ease: "power2.out"
              });
            }, 100); // Execute animation after 100ms
          }, 2000);
        }
      }
    );
  };

  // Auto-start battle when component mounts
  useEffect(() => {
    if (battlePhase === 'preparation') {
      const timer = setTimeout(() => {
        startBattle();
      }, 500); // Auto-start after 0.5s

      return () => clearTimeout(timer);
    }
  }, [battlePhase]);

  // Initial animation setup
  useEffect(() => {
    gsap.set(".battle-container", { opacity: 0 });
    gsap.set(".battle-arena", { opacity: 1, y: 0 }); 
    gsap.set(".battle-commands", { opacity: 0, y: 30 });
    gsap.set(".player-sidebar", { opacity: 0, x: -50 });
    gsap.set(".enemy-sidebar", { opacity: 0, x: 50 });
    gsap.set(".enemy-image", { 
      opacity: 0,
      scale: 1.6,
      filter: "brightness(0) contrast(0) saturate(0)"
    });
  }, []);

  const resetBattle = () => {
    setPlayers([player1, player2]);
    setBattleLog([]);
    setCurrentPlayer(player1);
    setIsPlayerTurn(true);
    setBattlePhase('preparation');
    setWinner(null);
    setShowBattleOverlay(false);
    setBattleResult(null);
    setCurrentMessage('');
    setIsTyping(false);
    setMessageQueue([]);
    setShowPlayerCommands(false);
    setIsAnimating(false);
    setEnemyDefeated(false);
  };

  // Auto-play AI turn
  useEffect(() => {
    if (!isPlayerTurn && battlePhase === 'battle' && !winner) {
      const timer = setTimeout(() => {
        const randomAction = battleActions[Math.floor(Math.random() * battleActions.length)];
        executeAction(randomAction);
        // AI attack effects
        if (randomAction.type === 'attack' || randomAction.type === 'special') {
          playSound('hit');
        }
        
        // Add delay after enemy turn
        setTimeout(() => {
          setIsPlayerTurn(true);
        }, 1000);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, battlePhase, winner]);

  // Command animation each time player turn comes around
  useEffect(() => {
    if (isPlayerTurn && battlePhase === 'battle' && showPlayerCommands) {
      // Execute animation after DOM rendering
      setTimeout(() => {
        // Set initial state
        gsap.set(".player-commands", { opacity: 0, x: 20});
        
        // Player commands animation
        gsap.to(".player-commands", { 
          opacity: 1, 
          x:0,
          duration: 0.6, 
          ease: "power2.out"
        });
      }, 100);
    } else if (!isPlayerTurn && battlePhase === 'battle' && showPlayerCommands) {
      // When AI turn, hide immediately (no animation)
      gsap.set(".player-commands", { opacity: 0, x: 20 });
    }
  }, [isPlayerTurn, battlePhase, showPlayerCommands]);

  // Process message queue
  useEffect(() => {
    if (messageQueue.length > 0 && !isTyping) {
      const nextMessage = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      typeMessage(nextMessage);
    }
  }, [messageQueue, isTyping]);


  // Enemy defeat animation
  useEffect(() => {
    if (enemyDefeated) {
      // Shake and pixelate fade out animation - simultaneous
      gsap.fromTo(".enemy-image", 
        { x: -100 },
        { 
          x: 100,
          duration: 0.05,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 100
        }
      );
      
      // Pixelated fade out effect
      gsap.to(".enemy-image", {
        filter: "brightness(0) contrast(0) saturate(0)",
        opacity: 0,
        // scale: 0.1,
        duration: 2,
        ease: "power2.inOut"
      });
    }
  }, [enemyDefeated]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-200 text-white relative battle-container py-2" style={{ zIndex: 9999 }}>
      {/* Battle Overlay */}
      {showBattleOverlay && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001] cursor-pointer overlay-backdrop"
          style={{ backdropFilter: "blur(0px)" }}
          onClick={() => {
            setShowBattleOverlay(false);
            onBattleEnd?.(winner || player1);
          }}
        >
          <div className="text-center victory-container">
            <div className="text-6xl font-bold text-yellow-400 mb-4 victory-text" style={{ opacity: 0, filter: "blur(20px)" }}>
              {battleResult === 'victory' ? 'VICTORY!' : '💀 DEFEATED... 💀'}
            </div>
            <p className="text-xl text-white continue-text" style={{ opacity: 0, filter: "blur(20px)" }}>Click to continue</p>
          </div>
        </div>
      )}

        {/* Battle Header */}
        <div className="bg-black/50 border-2 rounded-lg border-yellow-400 p-4 mb-4 mx-6 h-16 flex items-center justify-center" style={{ visibility: 'hidden' }}>
          <div className="text-center">
            <p className="text-xl font-bold text-white" id="battle-header-text">
              {/* Action name will be set dynamically */}
            </p>
          </div>
        </div>

      {/* Battle Arena - DQ Style */}
      <div className="flex-1 p-4  mx-2 battle-arena">
        <div className="w-full">
          <div className="grid grid-cols-4 gap-4 h-75">
            {/* Player Sidebar (25%) */}
            <div className="col-span-1 bg-black/30 border-4 border-white  rounded-lg p-4 player-sidebar">
              <div className=" h-full flex flex-col justify-center">
                <h2 className="text-lg font-bold text-blue-400 mb-2">{players[0].name}</h2>
                
                {/* HP Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">HP</span>
                    <span className="text-white">{players[0].hp} / {players[0].maxHp}</span>
                  </div>
                  <div className="w-full bg-red-600/70 border-2 border-gray-300 h-5 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-700 via-green-600 to-green-300 h-full transition-all duration-500 ease-out"
                      style={{ width: `${(players[0].hp / players[0].maxHp) * 100}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Enemy Image Area (50%) */}
            <div className="col-span-2 rounded-lg">
              <div className="h-full flex items-center justify-center">
                <img 
                  className={`img-enemy transition-transform enemy-image ${enemyDefeated ? 'enemy-defeated' : ''}`} 
                  src="https://cdnb.artstation.com/p/assets/images/images/006/503/737/original/william-robinson-boss-passive.gif?1499109339" 
                  alt="Enemy" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    maxHeight: '256px',
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
            </div>

            {/* Enemy Sidebar (25%) */}
            <div className="col-span-1 bg-black/0 border-4 border-yellow-400 rounded-lg p-4 enemy-sidebar">
              <div className="text-right h-full flex flex-col justify-center">
                <h2 className="text-lg font-bold text-red-400 mb-2">{players[1].name}</h2>
                
                {/* HP Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">HP</span>
                    <span className="text-white">{players[1].hp} / {players[1].maxHp}</span>
                  </div>
                  <div className="w-full bg-red-600/70 border-2 border-gray-300 h-5 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-700 via-orange-600 to-orange-300 h-full transition-all duration-500 ease-out"
                      style={{ width: `${(players[1].hp / players[1].maxHp) * 100}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area - DQ Style */}
      <div className="bg-black/0 p-4 mt-4 mx-2 battle-commands">
        <div className="w-full">
          <div className="grid grid-cols-4 gap-4 h-70">

            {/* Battle Message Area (50%) - Always Fixed */}
            <div className="col-span-3">
              <div className=" flex flex-col justify-center">
                <div className="bg-gray-900/50 p-6 rounded border-2 border-gray-600 w-full flex items-start justify-start" style={{ height: '300px' }}>
                  <div className="text-white text-xl text-left w-full">
                    {currentMessage}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Area (25%) - Always Fixed */}
            <div className="col-span-1">
              <div className="flex flex-col justify-center">                

                {battlePhase === 'battle' && showPlayerCommands && (
                  <div className='bg-black/20 p-3 player-commands' style={{ 
                    opacity: isPlayerTurn ? 0 : 0,
                    visibility: isPlayerTurn ? 'visible' : 'hidden'
                  }}>
                    <h3 className="text-lg font-bold text-yellow-400 mb-4 text-center">Actions</h3>
                    <div className="space-y-2">
                      {battleActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => executeAction(action)}
                          disabled={!isPlayerTurn}
                          className={`w-full p-3 border-2 transition-all rounded-lg action-button ${
                            isPlayerTurn 
                              ? 'bg-gray-800 border-gray-600 hover:border-yellow-400 cursor-pointer' 
                              : 'bg-gray-900 border-gray-700 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <h4 className="font-bold text-white text-sm mb-1">{action.name}</h4>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main CommandBattle component - WebtoonViewer already handles EncounterPortal, so start battle immediately
export default function CommandBattle({ player1, player2, onBattleStart, onBattleEnd }: CommandBattleProps) {
  // WebtoonViewer already handles EncounterPortal, so render battle component directly
  return <BattleComponent player1={player1} player2={player2} onBattleStart={onBattleStart} onBattleEnd={onBattleEnd} />;
}
