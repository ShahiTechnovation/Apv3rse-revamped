"use client";

import React from 'react';
import { classNames } from '~/utils/classNames';

interface AetherFlowBackgroundLightProps {
    theme?: 'dark' | 'light' | 'auto';
}

// Light theme version with white background and neon green particles
const AetherFlowBackgroundLight: React.FC<AetherFlowBackgroundLightProps> = ({ theme = 'auto' }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [currentTheme, setCurrentTheme] = React.useState<'dark' | 'light'>('light');

    React.useEffect(() => {
        // Detect theme based on prop or system preference
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
            
            const handleChange = (e: MediaQueryListEvent) => {
                setCurrentTheme(e.matches ? 'dark' : 'light');
            };
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            setCurrentTheme(theme);
        }
    }, [theme]);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

        // Theme colors
        const colors = currentTheme === 'light' 
            ? {
                background: 'rgba(255, 255, 255, 0.98)',
                backgroundGradient: 'linear-gradient(to bottom, #ffffff, #f0fff4)',
                particle: 'rgba(0, 255, 127, 0.6)', // Neon green
                particleHover: 'rgba(0, 255, 127, 0.9)',
                connectionNormal: 'rgba(0, 200, 100, 0.3)',
                connectionHover: 'rgba(0, 255, 127, 0.6)',
              }
            : {
                background: 'rgba(0, 0, 0, 0.95)',
                backgroundGradient: 'linear-gradient(to bottom, #0a0a0a, #1a0a2e)',
                particle: 'rgba(191, 128, 255, 0.4)',
                particleHover: 'rgba(191, 128, 255, 0.8)',
                connectionNormal: 'rgba(200, 150, 255, 0.3)',
                connectionHover: 'rgba(255, 255, 255, 0.5)',
              };

        // Particle class for the animated particles
        class Particle {
            x: number;
            y: number;
            directionX: number;
            directionY: number;
            size: number;
            color: string;
            baseColor: string;

            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
                this.baseColor = color;
            }

            draw() {
                if (!ctx) return;
                
                // Add glow effect for light theme
                if (currentTheme === 'light') {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = colors.particle;
                }
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Reset shadow
                ctx.shadowBlur = 0;
            }

            update() {
                if (!canvas) return;
                
                if (this.x > canvas.width || this.x < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.directionY = -this.directionY;
                }

                // Mouse collision detection with enhanced interaction
                if (mouse.x !== null && mouse.y !== null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius + this.size) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouse.radius - distance) / mouse.radius;
                        this.x -= forceDirectionX * force * 5;
                        this.y -= forceDirectionY * force * 5;
                        
                        // Change color on hover proximity
                        this.color = colors.particleHover;
                    } else {
                        this.color = this.baseColor;
                    }
                }

                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            if (!canvas) return;
            particles = [];
            let numberOfParticles = (canvas.height * canvas.width) / 12000; // Slightly fewer particles for cleaner look
            
            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 2.5) + 1;
                let x = (Math.random() * ((window.innerWidth - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((window.innerHeight - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * 0.4) - 0.2;
                let directionY = (Math.random() * 0.4) - 0.2;
                
                particles.push(new Particle(x, y, directionX, directionY, size, colors.particle));
            }
        }

        const resizeCanvas = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init(); 
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const connect = () => {
            if (!ctx || !canvas) return;
            let opacityValue = 1;
            
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                        + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        
                        let dx_mouse_a = particles[a].x - (mouse.x || 0);
                        let dy_mouse_a = particles[a].y - (mouse.y || 0);
                        let distance_mouse_a = Math.sqrt(dx_mouse_a*dx_mouse_a + dy_mouse_a*dy_mouse_a);

                        // Enhanced line styling for light theme
                        if (mouse.x && distance_mouse_a < mouse.radius) {
                            if (currentTheme === 'light') {
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = colors.connectionHover;
                            }
                            ctx.strokeStyle = colors.connectionHover;
                            ctx.lineWidth = 2;
                        } else {
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = colors.connectionNormal;
                            ctx.lineWidth = 1;
                        }
                        
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                        
                        // Reset shadow
                        ctx.shadowBlur = 0;
                    }
                }
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            animationFrameId = requestAnimationFrame(animate);
            
            // Clear canvas with theme-appropriate background
            ctx.fillStyle = colors.background;
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            connect();
        };
        
        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };
        
        const handleMouseOut = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, [currentTheme]);

    const gradientStyle = currentTheme === 'light' 
        ? 'linear-gradient(to bottom, #ffffff, #f0fff4)' // White to very light green
        : 'linear-gradient(to bottom, #0a0a0a, #1a0a2e)'; // Dark theme gradient

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full -z-10"
            style={{ 
                background: gradientStyle,
                pointerEvents: 'auto'
            }}
        />
    );
};

export default AetherFlowBackgroundLight;
