'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Heart, Shield, Zap, RotateCcw, Play, Pause } from 'lucide-react';

interface Vector2D {
  x: number;
  y: number;
}

interface Asteroid {
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface Bullet {
  position: Vector2D;
  velocity: Vector2D;
  lifetime: number;
}

interface PowerUp {
  position: Vector2D;
  type: 'shield' | 'rapid' | 'multi';
  lifetime: number;
}

interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  lifetime: number;
  color: string;
}

export default function AsteroidShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  
  // Game objects
  const [ship, setShip] = useState<Vector2D>({ x: 400, y: 300 });
  const [shipAngle, setShipAngle] = useState(0);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  
  // Power-up states
  const [hasShield, setHasShield] = useState(false);
  const [rapidFire, setRapidFire] = useState(false);
  const [multiShot, setMultiShot] = useState(false);
  const [powerUpTimers, setPowerUpTimers] = useState({ shield: 0, rapid: 0, multi: 0 });
  
  // Controls
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    up: false,
    space: false,
  });
  const [mousePos, setMousePos] = useState<Vector2D>({ x: 400, y: 300 });
  const [lastShot, setLastShot] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize game
  useEffect(() => {
    const savedHighScore = localStorage.getItem('asteroidHighScore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    
    // Check if mobile
    setIsMobile('ontouchstart' in window);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setKeys(k => ({ ...k, left: true }));
          break;
        case 'ArrowRight':
        case 'd':
          setKeys(k => ({ ...k, right: true }));
          break;
        case 'ArrowUp':
        case 'w':
          setKeys(k => ({ ...k, up: true }));
          break;
        case ' ':
          e.preventDefault();
          setKeys(k => ({ ...k, space: true }));
          break;
        case 'Escape':
          if (gameState === 'playing') setGameState('paused');
          else if (gameState === 'paused') setGameState('playing');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setKeys(k => ({ ...k, left: false }));
          break;
        case 'ArrowRight':
        case 'd':
          setKeys(k => ({ ...k, right: false }));
          break;
        case 'ArrowUp':
        case 'w':
          setKeys(k => ({ ...k, up: false }));
          break;
        case ' ':
          setKeys(k => ({ ...k, space: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Mouse/Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      setMousePos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Start new game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setWave(1);
    setShip({ x: 400, y: 300 });
    setShipAngle(0);
    setBullets([]);
    setParticles([]);
    setPowerUps([]);
    setHasShield(false);
    setRapidFire(false);
    setMultiShot(false);
    setPowerUpTimers({ shield: 0, rapid: 0, multi: 0 });
    spawnWave(1);
  };

  // Spawn asteroids for wave
  const spawnWave = (waveNumber: number) => {
    const newAsteroids: Asteroid[] = [];
    const asteroidCount = 3 + waveNumber * 2;
    
    for (let i = 0; i < asteroidCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: // Top
          x = Math.random() * 800;
          y = -50;
          break;
        case 1: // Right
          x = 850;
          y = Math.random() * 600;
          break;
        case 2: // Bottom
          x = Math.random() * 800;
          y = 650;
          break;
        default: // Left
          x = -50;
          y = Math.random() * 600;
          break;
      }
      
      newAsteroids.push({
        position: { x, y },
        velocity: {
          x: (Math.random() - 0.5) * (1 + waveNumber * 0.2),
          y: (Math.random() - 0.5) * (1 + waveNumber * 0.2),
        },
        size: 30 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      });
    }
    
    setAsteroids(newAsteroids);
  };

  // Create explosion particles
  const createExplosion = (pos: Vector2D, color: string = '#ff6b6b') => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        position: { ...pos },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        lifetime: 30,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Shoot bullet
  const shoot = useCallback(() => {
    const now = Date.now();
    const fireRate = rapidFire ? 100 : 250;
    
    if (now - lastShot < fireRate) return;
    setLastShot(now);
    
    const angle = shipAngle;
    const speed = 10;
    const newBullets: Bullet[] = [];
    
    if (multiShot) {
      // Triple shot
      for (let i = -1; i <= 1; i++) {
        const bulletAngle = angle + i * 0.2;
        newBullets.push({
          position: { ...ship },
          velocity: {
            x: Math.cos(bulletAngle) * speed,
            y: Math.sin(bulletAngle) * speed,
          },
          lifetime: 60,
        });
      }
    } else {
      // Single shot
      newBullets.push({
        position: { ...ship },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        lifetime: 60,
      });
    }
    
    setBullets(prev => [...prev, ...newBullets]);
  }, [ship, shipAngle, lastShot, rapidFire, multiShot]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'playing') return;
    
    const deltaTime = timestamp - lastTimeRef.current;
    if (deltaTime < 16) { // Cap at 60 FPS
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    lastTimeRef.current = timestamp;
    
    // Update ship angle to face mouse
    const dx = mousePos.x - ship.x;
    const dy = mousePos.y - ship.y;
    const targetAngle = Math.atan2(dy, dx);
    setShipAngle(targetAngle);
    
    // Update ship position
    setShip(prev => {
      let newX = prev.x;
      let newY = prev.y;
      const speed = 5;
      
      if (keys.up) {
        newX += Math.cos(targetAngle) * speed;
        newY += Math.sin(targetAngle) * speed;
      }
      if (keys.left) {
        newX -= Math.cos(targetAngle + Math.PI / 2) * speed;
        newY -= Math.sin(targetAngle + Math.PI / 2) * speed;
      }
      if (keys.right) {
        newX += Math.cos(targetAngle + Math.PI / 2) * speed;
        newY += Math.sin(targetAngle + Math.PI / 2) * speed;
      }
      
      // Keep ship on screen
      newX = Math.max(20, Math.min(780, newX));
      newY = Math.max(20, Math.min(580, newY));
      
      return { x: newX, y: newY };
    });
    
    // Shoot if space is pressed
    if (keys.space) {
      shoot();
    }
    
    // Update asteroids
    setAsteroids(prev => prev.map(asteroid => ({
      ...asteroid,
      position: {
        x: asteroid.position.x + asteroid.velocity.x,
        y: asteroid.position.y + asteroid.velocity.y,
      },
      rotation: asteroid.rotation + asteroid.rotationSpeed,
    })).filter(asteroid => {
      // Wrap around screen
      if (asteroid.position.x < -100) asteroid.position.x = 900;
      if (asteroid.position.x > 900) asteroid.position.x = -100;
      if (asteroid.position.y < -100) asteroid.position.y = 700;
      if (asteroid.position.y > 700) asteroid.position.y = -100;
      return true;
    }));
    
    // Update bullets
    setBullets(prev => prev.map(bullet => ({
      ...bullet,
      position: {
        x: bullet.position.x + bullet.velocity.x,
        y: bullet.position.y + bullet.velocity.y,
      },
      lifetime: bullet.lifetime - 1,
    })).filter(bullet => 
      bullet.lifetime > 0 &&
      bullet.position.x > -10 && bullet.position.x < 810 &&
      bullet.position.y > -10 && bullet.position.y < 610
    ));
    
    // Update particles
    setParticles(prev => prev.map(particle => ({
      ...particle,
      position: {
        x: particle.position.x + particle.velocity.x,
        y: particle.position.y + particle.velocity.y,
      },
      velocity: {
        x: particle.velocity.x * 0.98,
        y: particle.velocity.y * 0.98,
      },
      lifetime: particle.lifetime - 1,
    })).filter(particle => particle.lifetime > 0));
    
    // Update power-ups
    setPowerUps(prev => prev.map(powerUp => ({
      ...powerUp,
      lifetime: powerUp.lifetime - 1,
    })).filter(powerUp => powerUp.lifetime > 0));
    
    // Update power-up timers
    setPowerUpTimers(prev => ({
      shield: Math.max(0, prev.shield - 1),
      rapid: Math.max(0, prev.rapid - 1),
      multi: Math.max(0, prev.multi - 1),
    }));
    
    setHasShield(powerUpTimers.shield > 0);
    setRapidFire(powerUpTimers.rapid > 0);
    setMultiShot(powerUpTimers.multi > 0);
    
    // Check collisions
    checkCollisions();
    
    // Check wave completion
    if (asteroids.length === 0) {
      setWave(prev => prev + 1);
      spawnWave(wave + 1);
      
      // Spawn power-up every 2 waves
      if ((wave + 1) % 2 === 0) {
        spawnPowerUp();
      }
    }
    
    // Draw everything
    draw();
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, ship, shipAngle, mousePos, keys, asteroids, bullets, particles, powerUps, wave, powerUpTimers, shoot]);

  // Check collisions
  const checkCollisions = () => {
    // Bullet-asteroid collisions
    bullets.forEach((bullet, bIndex) => {
      asteroids.forEach((asteroid, aIndex) => {
        const dx = bullet.position.x - asteroid.position.x;
        const dy = bullet.position.y - asteroid.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.size) {
          // Remove bullet
          setBullets(prev => prev.filter((_, i) => i !== bIndex));
          
          // Split or remove asteroid
          if (asteroid.size > 25) {
            // Split into smaller asteroids
            const newAsteroids: Asteroid[] = [];
            for (let i = 0; i < 2; i++) {
              newAsteroids.push({
                position: { ...asteroid.position },
                velocity: {
                  x: (Math.random() - 0.5) * 4,
                  y: (Math.random() - 0.5) * 4,
                },
                size: asteroid.size / 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
              });
            }
            setAsteroids(prev => [...prev.filter((_, i) => i !== aIndex), ...newAsteroids]);
          } else {
            // Remove asteroid
            setAsteroids(prev => prev.filter((_, i) => i !== aIndex));
          }
          
          // Add score
          const points = Math.floor(100 / asteroid.size * 10);
          setScore(prev => prev + points);
          setExperience(prev => prev + points);
          
          // Create explosion
          createExplosion(asteroid.position);
          
          // Level up check
          if (experience >= level * 1000) {
            setLevel(prev => prev + 1);
          }
        }
      });
    });
    
    // Ship-asteroid collisions
    if (!hasShield) {
      asteroids.forEach(asteroid => {
        const dx = ship.x - asteroid.position.x;
        const dy = ship.y - asteroid.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.size + 15) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              endGame();
            }
            return newLives;
          });
          
          // Create explosion
          createExplosion(ship, '#4a90e2');
          
          // Give temporary shield
          setPowerUpTimers(prev => ({ ...prev, shield: 180 }));
          setHasShield(true);
        }
      });
    }
    
    // Ship-powerup collisions
    powerUps.forEach((powerUp, index) => {
      const dx = ship.x - powerUp.position.x;
      const dy = ship.y - powerUp.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        setPowerUps(prev => prev.filter((_, i) => i !== index));
        
        switch (powerUp.type) {
          case 'shield':
            setPowerUpTimers(prev => ({ ...prev, shield: 600 }));
            break;
          case 'rapid':
            setPowerUpTimers(prev => ({ ...prev, rapid: 600 }));
            break;
          case 'multi':
            setPowerUpTimers(prev => ({ ...prev, multi: 600 }));
            break;
        }
      }
    });
  };

  // Spawn power-up
  const spawnPowerUp = () => {
    const types: ('shield' | 'rapid' | 'multi')[] = ['shield', 'rapid', 'multi'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    setPowerUps(prev => [...prev, {
      position: {
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
      },
      type,
      lifetime: 600,
    }]);
  };

  // Draw game
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137) % 800;
      const y = (i * 89) % 600;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.lifetime / 30;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.position.x - 2, particle.position.y - 2, 4, 4);
      ctx.restore();
    });
    
    // Draw power-ups
    powerUps.forEach(powerUp => {
      ctx.save();
      ctx.translate(powerUp.position.x, powerUp.position.y);
      ctx.rotate(Date.now() * 0.002);
      
      // Draw power-up icon
      ctx.strokeStyle = powerUp.type === 'shield' ? '#00ff00' :
                       powerUp.type === 'rapid' ? '#ff00ff' :
                       '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      if (powerUp.type === 'shield') {
        // Shield icon
        ctx.moveTo(0, -15);
        ctx.lineTo(10, -5);
        ctx.lineTo(10, 10);
        ctx.lineTo(0, 15);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-10, -5);
        ctx.closePath();
      } else if (powerUp.type === 'rapid') {
        // Lightning icon
        ctx.moveTo(-5, -15);
        ctx.lineTo(0, 0);
        ctx.lineTo(-5, 0);
        ctx.lineTo(5, 15);
        ctx.lineTo(0, 0);
        ctx.lineTo(5, 0);
      } else {
        // Multi-shot icon
        for (let i = 0; i < 3; i++) {
          const angle = (i - 1) * 0.3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle - Math.PI / 2) * 15, Math.sin(angle - Math.PI / 2) * 15);
        }
      }
      
      ctx.stroke();
      ctx.restore();
    });
    
    // Draw asteroids
    asteroids.forEach(asteroid => {
      ctx.save();
      ctx.translate(asteroid.position.x, asteroid.position.y);
      ctx.rotate(asteroid.rotation);
      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Draw irregular asteroid shape
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points;
        const radius = asteroid.size + Math.sin(i * 1.7) * 5;
        if (i === 0) {
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    
    // Draw bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);
    
    // Draw shield if active
    if (hasShield) {
      ctx.strokeStyle = '#00ff00';
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    // Draw ship body
    ctx.strokeStyle = '#4a90e2';
    ctx.fillStyle = '#2c5aa0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw engine flame
    if (keys.up) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(-15 - Math.random() * 5, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
    
    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Wave: ${wave}`, 20, 70);
    ctx.fillText(`Level: ${level}`, 20, 100);
    
    // Draw lives
    for (let i = 0; i < lives; i++) {
      ctx.save();
      ctx.translate(750 - i * 30, 40);
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(-8, -8, -8, 0, 0, 8);
      ctx.bezierCurveTo(8, 0, 8, -8, 0, -8);
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw power-up indicators
    if (hasShield) {
      ctx.fillStyle = '#00ff00';
      ctx.fillText(`Shield: ${Math.ceil(powerUpTimers.shield / 60)}s`, 20, 560);
    }
    if (rapidFire) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillText(`Rapid: ${Math.ceil(powerUpTimers.rapid / 60)}s`, 150, 560);
    }
    if (multiShot) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText(`Multi: ${Math.ceil(powerUpTimers.multi / 60)}s`, 280, 560);
    }
  };

  // End game
  const endGame = () => {
    setGameState('gameOver');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('asteroidHighScore', score.toString());
    }
  };

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop, gameState]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-6 h-6" />
          Asteroid Shooter
        </CardTitle>
        <CardDescription>Destroy asteroids and survive the waves!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-black"
            style={{ maxWidth: '800px', imageRendering: 'pixelated' }}
          />
          
          {gameState === 'menu' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
              <div className="text-center text-white">
                <Rocket className="w-24 h-24 mx-auto mb-4 text-blue-400" />
                <h2 className="text-3xl font-bold mb-4">Asteroid Shooter</h2>
                <p className="mb-2">Use WASD or Arrow Keys to move</p>
                <p className="mb-2">Mouse to aim</p>
                <p className="mb-6">Space to shoot</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-400">High Score: {highScore}</p>
                  <p className="text-sm text-gray-400">Level: {level}</p>
                </div>
                <Button onClick={startGame} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          )}
          
          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
              <div className="text-center text-white">
                <Pause className="w-24 h-24 mx-auto mb-4 text-yellow-400" />
                <h2 className="text-3xl font-bold mb-6">Game Paused</h2>
                <Button onClick={() => setGameState('playing')} size="lg">
                  Resume Game
                </Button>
              </div>
            </div>
          )}
          
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                <p className="text-2xl mb-2">Final Score: {score}</p>
                <p className="text-lg mb-2">Wave Reached: {wave}</p>
                {score > highScore && (
                  <p className="text-yellow-400 mb-4">New High Score!</p>
                )}
                <div className="flex gap-4 justify-center">
                  <Button onClick={startGame} size="lg">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={() => setGameState('menu')} variant="outline" size="lg">
                    Main Menu
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {isMobile && gameState === 'playing' && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onTouchStart={() => setKeys(k => ({ ...k, left: true }))}
                onTouchEnd={() => setKeys(k => ({ ...k, left: false }))}
              >
                ←
              </Button>
              <Button
                size="sm"
                variant="outline"
                onTouchStart={() => setKeys(k => ({ ...k, up: true }))}
                onTouchEnd={() => setKeys(k => ({ ...k, up: false }))}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onTouchStart={() => setKeys(k => ({ ...k, right: true }))}
                onTouchEnd={() => setKeys(k => ({ ...k, right: false }))}
              >
                →
              </Button>
              <Button
                size="sm"
                variant="outline"
                onTouchStart={() => setKeys(k => ({ ...k, space: true }))}
                onTouchEnd={() => setKeys(k => ({ ...k, space: false }))}
                className="ml-4"
              >
                Fire
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
            <Shield className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <p className="font-semibold">Shield</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Temporary protection</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <p className="font-semibold">Rapid Fire</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Faster shooting</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
            <div className="w-4 h-4 mx-auto mb-1 text-yellow-500">⚡</div>
            <p className="font-semibold">Multi-Shot</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Triple bullets</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}