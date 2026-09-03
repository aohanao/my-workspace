'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  color: string
  rotation: number
  rotSpeed: number
  shape: 'circle' | 'diamond' | 'cross'
}

interface PathPoint {
  x: number
  y: number
  time: number
}

export function TechCursorEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // 鼠标坐标跟踪（带平滑插值）
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      speed: 0,
      active: false,
    }

    const pathPoints: PathPoint[] = []
    const particles: Particle[] = []
    let lastX = width / 2
    let lastY = height / 2
    let pulseAngle = 0

    // 深色高级感配色调色板（暗夜电磁紫、深邃冰蓝青、黑曜微光）
    const THEME_COLORS = [
      'rgba(99, 102, 241, ',   // 靛紫 (Indigo)
      'rgba(147, 51, 234, ',   // 电磁紫 (Purple)
      'rgba(14, 165, 233, ',   // 极深冰青 (Deep Cyan)
      'rgba(59, 130, 246, ',   // 深海冷蓝 (Royal Blue)
      'rgba(129, 140, 248, ',  // 幽光紫蓝 (Soft Glow)
    ]

    const handleMouseMove = (e: MouseEvent) => {
      mouse.active = true
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY

      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)

      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY)
      mouse.speed = dist

      // 记录轨迹平滑点
      pathPoints.push({ x: e.clientX, y: e.clientY, time: Date.now() })
      if (pathPoints.length > 24) {
        pathPoints.shift()
      }

      // 移动时爆发具有冲击力的多重粒子（更夸张、更酷炫的动力学发射）
      const count = Math.min(6, Math.max(2, Math.floor(dist / 6)))
      for (let i = 0; i < count; i++) {
        const colorPrefix = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)]
        const angle = Math.random() * Math.PI * 2
        const spd = Math.random() * 2.2 + 0.5
        const shapes: ('circle' | 'diamond' | 'cross')[] = ['circle', 'diamond', 'cross']

        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * spd + (e.clientX - lastX) * 0.08,
          vy: Math.sin(angle) * spd + (e.clientY - lastY) * 0.08,
          size: Math.random() * 3.5 + 1.2,
          alpha: 0.8,
          life: 0,
          maxLife: Math.floor(Math.random() * 25 + 20),
          color: colorPrefix,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        })
      }

      lastX = e.clientX
      lastY = e.clientY

      if (particles.length > 70) {
        particles.splice(0, particles.length - 70)
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 鼠标插值跟随
      mouse.x += (mouse.targetX - mouse.x) * 0.22
      mouse.y += (mouse.targetY - mouse.y) * 0.22
      pulseAngle += 0.04

      // 1. 核心深色聚光晕 (深色低饱和、高级紫蓝暗核光芒)
      if (mouse.active) {
        const coreGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          280
        )
        coreGradient.addColorStop(0, 'rgba(79, 70, 229, 0.08)')
        coreGradient.addColorStop(0.3, 'rgba(99, 102, 241, 0.04)')
        coreGradient.addColorStop(0.65, 'rgba(14, 165, 233, 0.02)')
        coreGradient.addColorStop(1, 'transparent')

        ctx.fillStyle = coreGradient
        ctx.fillRect(0, 0, width, height)

        // 夸张的科技力场光环（双层同心脉冲刻度环与 HUD 旋转射线）
        ctx.save()
        ctx.translate(mouse.x, mouse.y)

        // 内环脉冲
        const ringSize = 14 + Math.sin(pulseAngle * 2) * 2.5
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(0, 0, ringSize, 0, Math.PI * 2)
        ctx.stroke()

        // 外环 HUD 刻度微线
        ctx.rotate(pulseAngle)
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.25)'
        ctx.lineWidth = 1
        for (let i = 0; i < 4; i++) {
          ctx.beginPath()
          ctx.arc(0, 0, ringSize + 8, i * Math.PI / 2 + 0.15, (i + 1) * Math.PI / 2 - 0.15)
          ctx.stroke()
        }

        // 十字极光准星
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'
        ctx.beginPath()
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0)
        ctx.moveTo(0, -6); ctx.lineTo(0, 6)
        ctx.stroke()

        ctx.restore()
      }

      // 2. 酷炫的流光拖尾带 (Plasma Ribbon Trail - 夸张连续光束)
      if (pathPoints.length > 2) {
        ctx.save()
        for (let i = 1; i < pathPoints.length; i++) {
          const p1 = pathPoints[i - 1]
          const p2 = pathPoints[i]
          const progress = i / pathPoints.length
          const alpha = progress * 0.45
          const width = progress * 3.5 + 0.5

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`
          ctx.lineWidth = width
          ctx.lineCap = 'round'
          ctx.shadowColor = 'rgba(147, 51, 234, 0.6)'
          ctx.shadowBlur = 8
          ctx.stroke()
        }
        ctx.restore()
      }

      // 3. 动态科技粒子渲染 (粒子包含旋转几何菱形与星芒)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.95
        p.vy *= 0.95
        p.rotation += p.rotSpeed

        const lifeRatio = 1 - p.life / p.maxLife
        p.alpha = Math.max(0, lifeRatio * 0.85)

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = `${p.color}${p.alpha})`
        ctx.shadowColor = `${p.color}0.7)`
        ctx.shadowBlur = 10

        const s = p.size * lifeRatio

        if (p.shape === 'diamond') {
          // 科技菱形
          ctx.beginPath()
          ctx.moveTo(0, -s * 1.5)
          ctx.lineTo(s, 0)
          ctx.moveTo(0, s * 1.5)
          ctx.lineTo(-s, 0)
          ctx.closePath()
          ctx.fill()
        } else if (p.shape === 'cross') {
          // 科技十字星芒
          ctx.lineWidth = 1.2
          ctx.strokeStyle = `${p.color}${p.alpha})`
          ctx.beginPath()
          ctx.moveTo(-s * 1.6, 0); ctx.lineTo(s * 1.6, 0)
          ctx.moveTo(0, -s * 1.6); ctx.lineTo(0, s * 1.6)
          ctx.stroke()
        } else {
          // 能量光球
          ctx.beginPath()
          ctx.arc(0, 0, s, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-20 transition-opacity duration-300"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  )
}
