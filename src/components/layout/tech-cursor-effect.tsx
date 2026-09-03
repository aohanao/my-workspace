'use client'

import { useEffect, useRef } from 'react'

interface FogPuff {
  x: number
  y: number
  radius: number
  alpha: number
  maxLife: number
  life: number
  colorStop: string
}

export function TechCursorEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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

    // 鼠标坐标跟踪（敏捷、丝滑的高响应跟随，避免在复杂 DOM 页面中迟滞）
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
    }

    // 大片雾化气溶胶烟雾节点池（限制在 14 个以内以保证极致 60fps）
    const fogPuffs: FogPuff[] = []
    let lastPuffX = width / 2
    let lastPuffY = height / 2
    let breathPhase = 0

    // DeepSeek 高级深色电影级冷雾调色板（深海蓝极光、暗夜墨蓝、冰川幽光）
    const FOG_PALETTE = [
      'rgba(30, 58, 110, ',   // 深海蓝极光雾
      'rgba(24, 43, 82, ',    // 暗夜墨蓝
      'rgba(40, 70, 130, ',   // 幽光冰雾
      'rgba(50, 60, 95, ',    // 钛灰紫烟
    ]

    const handleMouseMove = (e: MouseEvent) => {
      mouse.active = true
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY

      // 注意：绝对不要在 mousemove 中调用 document.documentElement.style.setProperty
      // 否则在秋招表格等大 DOM 页面会导致每帧重排重绘，造成极度严重的掉帧与光影延迟！

      const dist = Math.hypot(e.clientX - lastPuffX, e.clientY - lastPuffY)

      // 仅在位移超过 24px 时轻量生成大尺寸柔和光雾
      if (dist > 24) {
        const color = FOG_PALETTE[Math.floor(Math.random() * FOG_PALETTE.length)]
        fogPuffs.push({
          x: e.clientX,
          y: e.clientY,
          radius: Math.random() * 60 + 150, // 半径 150px ~ 210px 柔和弥散
          alpha: 0.08,                      // 低饱和深邃微光
          life: 0,
          maxLife: 35,                      // 优雅消散
          colorStop: color,
        })
        lastPuffX = e.clientX
        lastPuffY = e.clientY
      }

      if (fogPuffs.length > 14) {
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
      breathPhase += 0.025

      // 敏捷快速的插值系数 (0.35)，彻底解决在秋招页面移动很慢的痛点，全站统一极致丝滑
      const lerpSpeed = 0.35
      mouse.x += (mouse.targetX - mouse.x) * lerpSpeed
      mouse.y += (mouse.targetY - mouse.y) * lerpSpeed

      // 1. 绘制历史移动留下的大片雾化气溶胶极光 (Soft Volumetric Fog Trail)
      for (let i = fogPuffs.length - 1; i >= 0; i--) {
        const puff = fogPuffs[i]
        puff.life++
        const progress = puff.life / puff.maxLife
        const currentAlpha = puff.alpha * (1 - progress)

        if (puff.life >= puff.maxLife || currentAlpha <= 0) {
          fogPuffs.splice(i, 1)
          continue
        }

        const rad = puff.radius * (1 + progress * 0.25)
        const g = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, rad)
        g.addColorStop(0, `${puff.colorStop}${currentAlpha})`)
        g.addColorStop(0.55, `${puff.colorStop}${currentAlpha * 0.3})`)
        g.addColorStop(1, 'transparent')

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(puff.x, puff.y, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      // 2. 鼠标主焦点处的大片深邃星云光晕 (Atmospheric Ambient Nebula Glow)
      if (mouse.active) {
        const breathe = Math.sin(breathPhase) * 15
        const mainRadius = 290 + breathe // 大片环境雾光
        const nebulaGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mainRadius
        )
        nebulaGrad.addColorStop(0, 'rgba(45, 75, 140, 0.065)')
        nebulaGrad.addColorStop(0.4, 'rgba(30, 50, 95, 0.035)')
        nebulaGrad.addColorStop(0.8, 'rgba(15, 25, 50, 0.012)')
        nebulaGrad.addColorStop(1, 'transparent')

        ctx.fillStyle = nebulaGrad
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, mainRadius, 0, Math.PI * 2)
        ctx.fill()

        // 柔和的中心微光晕
        const coreGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 40)
        coreGrad.addColorStop(0, 'rgba(180, 210, 255, 0.06)')
        coreGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = coreGrad
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2)
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
  }, [])

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
