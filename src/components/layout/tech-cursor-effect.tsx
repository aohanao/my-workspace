'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface FogPuff {
  x: number
  y: number
  radius: number
  alpha: number
  maxLife: number
  life: number
  colorR: number
  colorG: number
  colorB: number
}

export function TechCursorEffect() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 用户指定：如果秋招求职管家页面效果不好，那就只这一页面不做拖尾光影
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
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
    }

    // 大片雾化气溶胶烟雾节点池
    const fogPuffs: FogPuff[] = []
    let lastPuffX = width / 2
    let lastPuffY = height / 2
    let breathPhase = 0

    // DeepSeek 风格高级大片极光冷雾调色板（清晰可见、大片雾化、深色高级感）
    const FOG_COLORS = [
      { r: 99, g: 102, b: 241 },  // 电磁靛紫
      { r: 56, g: 189, b: 248 },  // 冰川天青
      { r: 139, g: 92, b: 246 },  // 幽光紫雾
      { r: 37, g: 99, b: 235 },   // 深海宝蓝
    ]

    const handleMouseMove = (e: MouseEvent) => {
      mouse.active = true
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY

      const dist = Math.hypot(e.clientX - lastPuffX, e.clientY - lastPuffY)

      // 移动距离适中时释放大片雾化极光光团
      if (dist > 16) {
        const color = FOG_COLORS[Math.floor(Math.random() * FOG_COLORS.length)]
        fogPuffs.push({
          x: e.clientX,
          y: e.clientY,
          radius: Math.random() * 60 + 160, // 半径 160px ~ 220px 大面积气溶胶
          alpha: 0.24,                      // 清晰可见的大片光雾
          life: 0,
          maxLife: 38,                      // 优雅持续衰减
          colorR: color.r,
          colorG: color.g,
          colorB: color.b,
        })
        lastPuffX = e.clientX
        lastPuffY = e.clientY
      }

      if (fogPuffs.length > 20) {
        fogPuffs.shift()
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      breathPhase += 0.03

      // 丝滑敏捷跟随
      const lerpSpeed = 0.28
      mouse.x += (mouse.targetX - mouse.x) * lerpSpeed
      mouse.y += (mouse.targetY - mouse.y) * lerpSpeed

      // 1. 绘制鼠标移动轨迹留下的大片柔和雾化极光拖尾 (Atmospheric Aurora Fog Trail)
      for (let i = fogPuffs.length - 1; i >= 0; i--) {
        const puff = fogPuffs[i]
        puff.life++
        const progress = puff.life / puff.maxLife
        const currentAlpha = puff.alpha * (1 - progress)

        if (puff.life >= puff.maxLife || currentAlpha <= 0) {
          fogPuffs.splice(i, 1)
          continue
        }

        const rad = puff.radius * (1 + progress * 0.3)
        const g = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, rad)
        g.addColorStop(0, `rgba(${puff.colorR}, ${puff.colorG}, ${puff.colorB}, ${currentAlpha})`)
        g.addColorStop(0.4, `rgba(${puff.colorR}, ${puff.colorG}, ${puff.colorB}, ${currentAlpha * 0.45})`)
        g.addColorStop(0.75, `rgba(${puff.colorR}, ${puff.colorG}, ${puff.colorB}, ${currentAlpha * 0.12})`)
        g.addColorStop(1, 'transparent')

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(puff.x, puff.y, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      // 2. 鼠标主焦点处的大片深邃星云光晕 (Atmospheric Ambient Nebula Glow)
      if (mouse.active) {
        const breathe = Math.sin(breathPhase) * 18
        const mainRadius = 320 + breathe // 320px~340px 阔野大片光晕
        const nebulaGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mainRadius
        )
        nebulaGrad.addColorStop(0, 'rgba(99, 102, 241, 0.28)')      // 核心电磁靛紫光
        nebulaGrad.addColorStop(0.22, 'rgba(56, 189, 248, 0.18)')   // 冰川天青微光
        nebulaGrad.addColorStop(0.55, 'rgba(37, 99, 235, 0.08)')    // 深海蓝弥散
        nebulaGrad.addColorStop(0.85, 'rgba(30, 58, 138, 0.025)')   // 边缘微弱极光
        nebulaGrad.addColorStop(1, 'transparent')

        ctx.fillStyle = nebulaGrad
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, mainRadius, 0, Math.PI * 2)
        ctx.fill()

        // 中心高亮柔和微光球
        const coreGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 45)
        coreGrad.addColorStop(0, 'rgba(224, 231, 255, 0.25)')
        coreGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.12)')
        coreGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = coreGrad
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2)
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

  // 如果是在秋招求职管家页面，直接不渲染光影画布，保证该页面 100% 极速交互
  if (isCareerPage) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 will-change-transform"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        contain: 'strict',
      }}
      aria-hidden="true"
    />
  )
}
