'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// 鼠标流体拖尾粒子
interface FluidParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
  turbPhase: number
}

// 背景常驻随机浮动微尘粒子
interface AmbientParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  alpha: number
  color: string
  twinkleSpeed: number
  phase: number
}

export function TechCursorEffect() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 用户指定：在秋招求职管家页面（/career）关闭鼠标重度流体拖尾，保证超大表格极速；常驻背景星光在所有页面均柔和常驻
  const isCareerPage = pathname === '/career'

  useEffect(() => {
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

    // 1. 初始化全屏常驻随机浮动星尘粒子（72 颗，三层景深，带有真实微呼吸光晕，明显但不夺目）
    const ambientParticles: AmbientParticle[] = []
    const AMBIENT_COLORS = [
      'rgba(56, 189, 248, ',   // 冰川天青
      'rgba(168, 85, 247, ',  // 电磁浅紫
      'rgba(255, 255, 255, ',  // 纯白星光
      'rgba(52, 211, 153, ',   // 极光薄荷绿
      'rgba(251, 191, 36, ',   // 琥珀晨星
      'rgba(147, 197, 253, ',  // 深空幽蓝
    ]

    const TOTAL_STARS = 72
    for (let i = 0; i < TOTAL_STARS; i++) {
      let size: number
      let baseAlpha: number

      if (i < 36) {
        // 深景微尘 (0.9px ~ 1.5px)
        size = Math.random() * 0.6 + 0.9
        baseAlpha = Math.random() * 0.2 + 0.35
      } else if (i < 58) {
        // 中景呼吸星 (1.6px ~ 2.4px)
        size = Math.random() * 0.8 + 1.6
        baseAlpha = Math.random() * 0.25 + 0.45
      } else {
        // 前景闪烁明星 (2.5px ~ 3.4px，带微光晕)
        size = Math.random() * 0.9 + 2.5
        baseAlpha = Math.random() * 0.2 + 0.65
      }

      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size,
        baseAlpha,
        alpha: baseAlpha,
        color: AMBIENT_COLORS[Math.floor(Math.random() * AMBIENT_COLORS.length)],
        twinkleSpeed: Math.random() * 0.025 + 0.012,
        phase: Math.random() * Math.PI * 2,
      })
    }

    // 2. 鼠标坐标追踪与流体粒子发射池
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      active: false,
    }

    const fluidParticles: FluidParticle[] = []

    // 粒子流体调色板：冰川天青、冷晶蓝、电磁冷紫、纯白星光
    const FLUID_COLORS = [
      'rgba(56, 189, 248, ',   // 冰川天青
      'rgba(96, 165, 250, ',   // 冷晶蓝
      'rgba(129, 140, 248, ',  // 电磁冷紫
      'rgba(255, 255, 255, ',  // 纯白星尘
    ]

    const handleMouseMove = (e: MouseEvent) => {
      // 保持 /career 页面不发射鼠标拖尾，以确保大型千行表格极速滚动
      if (isCareerPage) return

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

      // 只要鼠标有移动，就顺滑释放星尘流体粒子（无激光连线、无粗苯光团）
      if (dist > 2) {
        // 根据移动速度发射 3 ~ 7 颗粒子，形成自然流淌的粒子沙流带
        const count = Math.min(7, Math.max(3, Math.floor(dist / 6)))

        for (let i = 0; i < count; i++) {
          const color = FLUID_COLORS[Math.floor(Math.random() * FLUID_COLORS.length)]
          // 沿着移动切线带有散开角度与流体动量
          const sprayAngle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 1.2
          const speed = Math.random() * 1.6 + 0.5

          fluidParticles.push({
            x: mouse.x + (Math.random() - 0.5) * 6,
            y: mouse.y + (Math.random() - 0.5) * 6,
            vx: Math.cos(sprayAngle) * speed * 0.45 + (Math.random() - 0.5) * 0.6,
            vy: Math.sin(sprayAngle) * speed * 0.45 + (Math.random() - 0.5) * 0.6,
            size: Math.random() * 1.5 + 1.1, // 1.1px ~ 2.6px 精致微细粒子
            color,
            alpha: Math.random() * 0.35 + 0.65,
            life: 0,
            maxLife: Math.floor(Math.random() * 25 + 30), // 30 ~ 55 帧优雅渐隐
            turbPhase: Math.random() * Math.PI * 2,
          })
        }
      }

      // 控制最大粒子数量，保障 60fps 满帧
      if (fluidParticles.length > 90) {
        fluidParticles.splice(0, fluidParticles.length - 90)
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // ================= 1. 渲染背景常驻随机浮动微尘粒子 =================
      for (let i = 0; i < ambientParticles.length; i++) {
        const ap = ambientParticles[i]
        ap.x += ap.vx
        ap.y += ap.vy

        // 视口边缘自然循环环绕
        if (ap.x < -10) ap.x = width + 10
        else if (ap.x > width + 10) ap.x = -10
        if (ap.y < -10) ap.y = height + 10
        else if (ap.y > height + 10) ap.y = -10

        // 柔和呼吸闪烁 (最低 0.2，最高可达 0.95，清晰可见但温和舒适)
        ap.phase += ap.twinkleSpeed
        const currentAlpha = Math.min(0.95, Math.max(0.2, ap.baseAlpha * (0.65 + Math.sin(ap.phase) * 0.5)))

        // 对于中大尺寸的星星，在其变亮时渲染柔和的发光微光晕
        if (ap.size >= 1.8 && currentAlpha > 0.45) {
          const haloRadius = ap.size * 2.8
          const halo = ctx.createRadialGradient(ap.x, ap.y, 0, ap.x, ap.y, haloRadius)
          halo.addColorStop(0, `${ap.color}${currentAlpha * 0.5})`)
          halo.addColorStop(0.5, `${ap.color}${currentAlpha * 0.15})`)
          halo.addColorStop(1, 'transparent')
          ctx.fillStyle = halo
          ctx.beginPath()
          ctx.arc(ap.x, ap.y, haloRadius, 0, Math.PI * 2)
          ctx.fill()
        }

        // 核心星点
        ctx.fillStyle = `${ap.color}${currentAlpha})`
        ctx.beginPath()
        ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // ================= 2. 渲染鼠标粒子流体拖尾 (Fluid Particle Stream) =================
      for (let i = fluidParticles.length - 1; i >= 0; i--) {
        const p = fluidParticles[i]
        p.life++

        // 流体物理阻尼与微涡流扰动
        p.turbPhase += 0.12
        p.x += p.vx + Math.sin(p.turbPhase) * 0.35
        p.y += p.vy + Math.cos(p.turbPhase) * 0.35
        p.vx *= 0.94
        p.vy *= 0.94

        const progress = p.life / p.maxLife
        const currentAlpha = p.alpha * (1 - progress)

        if (p.life >= p.maxLife || currentAlpha <= 0) {
          fluidParticles.splice(i, 1)
          continue
        }

        const currentSize = p.size * (1 - progress * 0.35)

        // 细腻发光粒子绘制（微光晕 + 高光星核）
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 2.8)
        halo.addColorStop(0, `${p.color}${currentAlpha * 0.8})`)
        halo.addColorStop(0.45, `${p.color}${currentAlpha * 0.25})`)
        halo.addColorStop(1, 'transparent')

        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize * 2.8, 0, Math.PI * 2)
        ctx.fill()

        // 核心亮点
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize * 0.65, 0, Math.PI * 2)
        ctx.fill()
      }

      // ================= 3. 鼠标当前位置极简科技微准星焦点 =================
      if (!isCareerPage && mouse.active && mouse.x > 0 && mouse.y > 0) {
        // 轻盈 14px 微光晕
        const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 14)
        cursorGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)')
        cursorGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = cursorGlow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2)
        ctx.fill()

        // 核心 1.5px 纯白微星
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
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
