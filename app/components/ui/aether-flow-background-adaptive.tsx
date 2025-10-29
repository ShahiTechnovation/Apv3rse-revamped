"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';

// Adaptive theme version that switches between dark purple and light neon green
const AetherFlowBackgroundAdaptive: React.FC = () => {
    const theme = useStore(themeStore);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const isLightTheme = theme === 'light';

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

        // Theme-based colors
        const colors = isLightTheme 
            ? {
                // Light theme: White background with neon green
                background: 'rgba(255, 255, 255, 0.95)',
                particle: 'rgba(0, 255, 100, 0.5)', // Neon green
                particleGlow: 'rgba(0, 255, 100, 0.8)',
                connectionNormal: 'rgba(0, 200, 80, 0.25)',
                connectionHover: 'rgba(0, 255, 100, 0.5)',
                shadowColor: '#00ff64',
              }
            : {
                // Dark theme: Original purple theme
                background: 'rgba(0, 0, 0, 0.95)',
                particle: 'rgba(191, 128, 255, 0.4)',
                particleGlow: 'rgba(191, 128, 255, 0.8)',
                connectionNormal: 'rgba(200, 150, 255, 0.3)',
                connectionHover: 'rgba(255, 255, 255, 0.5)',
                shadowColor: '#bf80ff',
              };

        // Particle class
        class Particle {
            x: number;
            y: number;
            directionX: number;
            directionY: number;
            size: number;
            color: string;
            baseColor: string;
            pulsePhase: number;

            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
                this.baseColor = color;
                this.pulsePhase = Math.random() * Math.PI * 2;
            }

            draw() {
                if (!ctx) return;
                
                // Pulsing effect
                const pulseFactor = 1 + Math.sin(this.pulsePhase) * 0.2;
                this.pulsePhase += 0.05;
                
                // Glow effect
                if (isLightTheme) {
                    // Stronger glow for light theme
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = colors.shadowColor;
                } else {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = colors.shadowColor;
                }
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * pulseFactor, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Inner bright core
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5 * pulseFactor, 0, Math.PI * 2, false);
                ctx.fillStyle = isLightTheme ? 'rgba(0, 255, 100, 0.9)' : 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
                
                ctx.shadowBlur = 0;
            }

            update() {
                if (!canvas) return;
                
                // Bounce off edges
                if (this.x + this.size > canvas.width || this.x - this.size < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y + this.size > canvas.height || this.y - this.size < 0) {
                    this.directionY = -this.directionY;
                }

                // Mouse interaction
                if (mouse.x !== null && mouse.y !== null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius + this.size) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouse.radius - distance) / mouse.radius;
                        
                        // Repel from mouse
                        this.x -= forceDirectionX * force * 6;
                        this.y -= forceDirectionY * force * 6;
                        
                        // Brighten on hover
                        this.color = colors.particleGlow;
                    } else {
                        // Gradually return to base color
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
            
            // Adjust particle count based on theme
            let numberOfParticles = isLightTheme 
                ? (canvas.height * canvas.width) / 15000  // Fewer particles for cleaner light theme
                : (canvas.height * canvas.width) / 9000;   // Original density for dark theme
            
            for (let i = 0; i < numberOfParticles; i++) {
                let size = isLightTheme 
                    ? (Math.random() * 3) + 1.5  // Slightly larger for light theme
                    : (Math.random() * 2) + 1;   // Original size for dark theme
                    
                let x = Math.random() * canvas.width;
                let y = Math.random() * canvas.height;
                let directionX = (Math.random() * 0.5) - 0.25;
                let directionY = (Math.random() * 0.5) - 0.25;
                
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
            
            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Maximum connection distance
                    const maxDistance = isLightTheme ? 120 : 150;
                    
                    if (distance < maxDistance) {
                        let opacityValue = 1 - (distance / maxDistance);
                        
                        // Check mouse proximity
                        let dx_mouse = particles[a].x - (mouse.x || 0);
                        let dy_mouse = particles[a].y - (mouse.y || 0);
                        let distance_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

                        if (mouse.x && distance_mouse < mouse.radius) {
                            // Enhanced connection near mouse
                            if (isLightTheme) {
                                ctx.shadowBlur = 5;
                                ctx.shadowColor = colors.shadowColor;
                            }
                            ctx.strokeStyle = colors.connectionHover;
                            ctx.lineWidth = 2 * opacityValue;
                        } else {
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = colors.connectionNormal;
                            ctx.lineWidth = opacityValue;
                        }
                        
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            animationFrameId = requestAnimationFrame(animate);
            
            // Clear with theme background
            if (isLightTheme) {
                // Light theme: subtle gradient from white to very light green
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, '#f5fffa');
                ctx.fillStyle = gradient;
            } else {
                // Dark theme: original dark gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#0a0a0a');
                gradient.addColorStop(1, '#1a0a2e');
                ctx.fillStyle = gradient;
            }
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            
            // Draw connections
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
    }, [isLightTheme]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full -z-10"
            style={{ 
                pointerEvents: 'auto'
            }}
        />
    );
};

export default AetherFlowBackgroundAdaptive;
