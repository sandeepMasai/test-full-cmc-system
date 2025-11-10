import { useEffect, useRef } from 'react'

function AnimatedBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        let animationFrameId

        // Particle system
        const particles = []
        const particleCount = 50

        class Particle {
            constructor() {
                this.x = Math.random() * (canvas.width || window.innerWidth)
                this.y = Math.random() * (canvas.height || window.innerHeight)
                this.size = Math.random() * 3 + 1
                this.speedX = Math.random() * 0.5 - 0.25
                this.speedY = Math.random() * 0.5 - 0.25
                this.opacity = Math.random() * 0.5 + 0.2
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

                const width = canvas.width || window.innerWidth
                const height = canvas.height || window.innerHeight

                if (this.x > width) this.x = 0
                if (this.x < 0) this.x = width
                if (this.y > height) this.y = 0
                if (this.y < 0) this.y = height
            }

            draw() {
                ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            // Reposition particles if needed
            particles.forEach(particle => {
                if (particle.x > canvas.width) particle.x = canvas.width
                if (particle.y > canvas.height) particle.y = canvas.height
            })
        }
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle())
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw connections
            particles.forEach((particle, i) => {
                particle.update()
                particle.draw()

                // Connect nearby particles
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x
                    const dy = particle.y - otherParticle.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 150) {
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 150)})`
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        ctx.moveTo(particle.x, particle.y)
                        ctx.lineTo(otherParticle.x, otherParticle.y)
                        ctx.stroke()
                    }
                })
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <>
            {/* Animated gradient background */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 animate-gradient-shift"></div>

            {/* Floating animated blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            {/* Canvas particles */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none"
                style={{ zIndex: 0 }}
            />
        </>
    )
}

export default AnimatedBackground

