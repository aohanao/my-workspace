'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

export function TechCursorEffect() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 用户指定：仅在秋招求职管家页面（/career）不做拖尾光影，保障该页面绝对极速
  const isCareerPage = pathname === '/career'

  useEffect(() => {
    if (isCareerPage) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // 鼠标坐标跟踪
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      active: false,
    }

    // 高科技微光星尘粒子池
    const particles: Particle[] = []

    // 科技极光调色板：冰川天青、电磁冷紫、深海幽蓝、纯白星尘
    const PALETTE = [
      'rgba(56, 189, 248, ',   // 冰川天青
      'rgba(129, 140, 248, ',  // 电磁靛紫
      'rgba(192, 132, 252, ',  // 幽光紫雾
      'rgba(255, 255, 255, ',  // 纯白星光
    ]

    const handleMouseMove = (e: MouseEvent) => {
      const isFirstMove = !mouse.active
      mouse.active = true
      mouse.prevX = mouse.x
      mouse.prevY = mouse.y
      mouse.x = e.clientX
      mouse.y = e.clientY

      if (isFirstMove) return

      const dx = mouse.x - mouse.prevX
      const dy = mouse.y - mouse.prevY
      const dist = Math.hypot(dx, dy)

      // 随着鼠标移动，喷射细腻的科技星尘粒子流
      if (dist > 3) {
        // 根据移动速度产生 2 ~ 4 颗精细微光粒子
        const count = Math.min(4, Math.max(2, Math.floor(dist / 12)))

        for (let i = 0; i < count; i++) {
          const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
          // 扩散初速度与微小惯性阻尼
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.6
          const speed = Math.random() * 1.8 + 0.4

          particles.push({
            x: mouse.x + (Math.random() - 0.5) * 6,
            y: mouse.y + (Math.random() - 0.5) * 6,
            vx: -Math.cos(angle) * speed * 0.4 + (Math.random() - 0.5) * 0.8,
            vy: -Math.sin(angle) * speed * 0.4 + (Math.random() - 0.5) * 0.8,
            size: Math.random() * 1.8 + 1.4, // 1.4px ~ 3.2px 极细腻精致尺寸
            color,
            alpha: Math.random() * 0.35 + 0.65, // 0.65 ~ 1.0 清晰明亮
            life: 0,
            maxLife: Math.floor(Math.random() * 20 + 30), // 30 ~ 50 帧渐变消逝
          })
        }
      }

      // 控制粒子总数以维持极致 60fps
      if (particles.length > 55) {
        particles.splice(0, particles.length - 55)
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    let breathTime = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      breathTime += 0.04

      // 1. 绘制临近粒子间的极细科技星座网络连线 (Constellation Lines)
      const pLen = particles.length
      for (let i = 0; i < pLen; i++) {
        for (let j = i + 1; j < pLen; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const d = Math.hypot(p1.x - p2.x, p1.y - p2.y)

          if (d < 50) {
            const lineAlpha = (1 - d / 50) * Math.min(p1.alpha, p2.alpha) * 0.35
            ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`
            ctx.lineWidth = 0.65
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      // 2. 绘制星尘粒子本体与微光光晕 (Star Dust Particles with Soft Micro-Glow)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.95 // 流体空气阻尼
        p.vy *= 0.95

        const progress = p.life / p.maxLife
        const currentAlpha = p.alpha * (1 - progress)

        if (p.life >= p.maxLife || currentAlpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        const currentSize = p.size * (1 - progress * 0.35)

        // 外层柔和微晕
        const haloGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3.5)
        haloGrad.addColorStop(0, `${p.color}${currentAlpha * 0.75})`)
        haloGrad.addColorStop(0.5, `${p.color}${currentAlpha * 0.25})`)
        haloGrad.addColorStop(1, 'transparent')

        ctx.fillStyle = haloGrad
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize * 3.5, 0, Math.PI * 2)
        ctx.fill()

        // 核心高亮发光微点
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }

      // 3. 鼠标当前指针处的精致微焦点 (Micro Precision Glow Core)
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const pulse = Math.sin(breathTime) * 3
        const coreRadius = 20 + pulse // 17px ~ 23px 克制紧凑焦点，拒绝臃肿

        const coreGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, coreRadius)
        coreGlow.addColorStop(0, 'rgba(56, 189, 248, 0.28)')
        coreGlow.addColorStop(0.5, 'rgba(129, 140, 248, 0.12)')
        coreGlow.addColorStop(1, 'transparent')

        ctx.fillStyle = coreGlow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, coreRadius, 0, Math.PI * 2)
        ctx.fill()

        // 中心 1.5px 极小科技十字准星光核
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
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
  }, [isCareerPage])

  // 秋招求职管家页面完全不渲染画布
  if (isCareerPage) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 w-full h-full z-10 will-change-transform"
      style={{
        width: '100vw',
        height: '100vh',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
      }}
      aria-hidden="true"
    />
  )
}
