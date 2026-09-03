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

    // 鼠标坐标跟踪（带大惯性平滑阻尼，像流体一样跟随）
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

    // DeepSeek 高级深色电影级冷雾调色板（大片柔和极光幽蓝与深空墨雾）
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

      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)

      const dist = Math.hypot(e.clientX - lastPuffX, e.clientY - lastPuffY)

      // 仅在移动一段距离时释放大片雾化烟圈
      if (dist > 18) {
        const color = FOG_PALETTE[Math.floor(Math.random() * FOG_PALETTE.length)]
        // 生成大尺寸柔和光雾
        fogPuffs.push({
          x: e.clientX,
          y: e.clientY,
          radius: Math.random() * 80 + 160, // 半径 160px ~ 240px 大片弥散
          alpha: 0.09,                      // 低饱和极其克制的微光
          life: 0,
          maxLife: 45,                      // 缓慢消散
          colorStop: color,
        })
        lastPuffX = e.clientX
        lastPuffY = e.clientY
      }

      if (fogPuffs.length > 28) {
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
      breathPhase += 0.02

      // 平滑阻尼插值
      mouse.x += (mouse.targetX - mouse.x) * 0.12
      mouse.y += (mouse.targetY - mouse.y) * 0.12

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

        const rad = puff.radius * (1 + progress * 0.35)
        const g = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, rad)
        g.addColorStop(0, `${puff.colorStop}${currentAlpha})`)
        g.addColorStop(0.5, `${puff.colorStop}${currentAlpha * 0.35})`)
        g.addColorStop(1, 'transparent')

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(puff.x, puff.y, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      // 2. 鼠标主焦点处的大片深邃星云光晕 (Atmospheric Ambient Nebula Glow)
      if (mouse.active) {
        const breathe = Math.sin(breathPhase) * 20
        const mainRadius = 320 + breathe // 300px~340px 大片环境雾光
        const nebulaGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mainRadius
        )
        nebulaGrad.addColorStop(0, 'rgba(45, 75, 140, 0.07)')
        nebulaGrad.addColorStop(0.4, 'rgba(30, 50, 95, 0.04)')
        nebulaGrad.addColorStop(0.8, 'rgba(15, 25, 50, 0.015)')
        nebulaGrad.addColorStop(1, 'transparent')

        ctx.fillStyle = nebulaGrad
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, mainRadius, 0, Math.PI * 2)
        ctx.fill()

        // 极细微弱的中心环境微光点（直观感知焦点，不产生刺眼卡通线）
        const coreGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 45)
        coreGrad.addColorStop(0, 'rgba(180, 210, 255, 0.08)')
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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-500"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  )
}
