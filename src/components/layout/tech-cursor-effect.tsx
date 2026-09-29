'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// 背景常驻随机浮动纯黑白微尘粒子
interface AmbientParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  alpha: number
  twinkleSpeed: number
  phase: number
}

// 高级感方块拖尾粒子束 (Block-Trail Cyber Particle Beam)
interface BlockTrailBeam {
  x: number
  y: number
  angle: number
  targetAngle: number
  speed: number
  curveSpeed: number
  blockSize: number
  alpha: number
  life: number
  maxLife: number
  history: {
    x: number
    y: number
    angle: number
  }[]
  // 伴随拖尾飘落的微型方块碎屑
  debris: {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    alpha: number
    life: number
    maxLife: number
  }[]
}

// 鼠标流体拖尾粒子 (纯白极简)
interface FluidParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}

export function TechCursorEffect() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 用户指定：在秋招求职管家页面（/career）关闭鼠标流体拖尾，保证超大表格极速；常驻背景星光在所有页面均柔和常驻
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

    // 1. 初始化纯黑白常驻随机浮动微尘粒子（约 30 颗克制纯白星光，安静深空）
    const ambientParticles: AmbientParticle[] = []
    const TOTAL_STARS = 30

    for (let i = 0; i < TOTAL_STARS; i++) {
      const size = Math.random() * 1.0 + 0.8 // 0.8px ~ 1.8px 细腻白点
      const baseAlpha = Math.random() * 0.3 + 0.3

      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      })
    }

    // 2. 高级感方块拖尾粒子束发射池 (随性随机穿越，非僵硬超高速直线，优美优雅巡航)
    const blockBeams: BlockTrailBeam[] = []
    let nextBeamTimer = Math.floor(Math.random() * 80 + 40) // 1~2秒内触发首个

    const spawnBlockBeam = () => {
      // 随机选择生成边缘：0:左侧向右, 1:顶部向下, 2:右侧向左, 3:左上斜穿
      const side = Math.floor(Math.random() * 4)
      let startX = 0
      let startY = 0
      let initialAngle = 0

      if (side === 0) {
        // 左边边缘向右侧穿越
        startX = -30
        startY = Math.random() * height
        initialAngle = (Math.random() - 0.5) * 0.6 // -17° ~ +17°
      } else if (side === 1) {
        // 顶部边缘向下穿越
        startX = Math.random() * width
        startY = -30
        initialAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.7
      } else if (side === 2) {
        // 右边边缘向左穿越
        startX = width + 30
        startY = Math.random() * height
        initialAngle = Math.PI + (Math.random() - 0.5) * 0.6
      } else {
        // 斜对角优雅俯冲
        startX = Math.random() * (width * 0.5) - 30
        startY = -30
        initialAngle = Math.PI / 4 + (Math.random() - 0.5) * 0.4
      }

      // 优雅巡航速度 (4.5px ~ 6.5px / 帧，非瞬间闪现，清晰可见方块拖尾)
      const speed = Math.random() * 2.0 + 4.2
      const blockSize = Math.random() * 1.5 + 4.5 // 4.5px ~ 6.0px 主方块
      const maxLife = Math.floor(Math.max(width, height) / speed) + 60

      blockBeams.push({
        x: startX,
        y: startY,
        angle: initialAngle,
        targetAngle: initialAngle + (Math.random() - 0.5) * 0.8,
        speed,
        curveSpeed: (Math.random() - 0.5) * 0.015, // 优雅轻微摆动弯曲
        blockSize,
        alpha: 0,
        life: 0,
        maxLife,
        history: [],
        debris: [],
      })
    }

    // 3. 鼠标纯白微流体粒子
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      active: false,
    }

    const fluidParticles: FluidParticle[] = []

    const handleMouseMove = (e: MouseEvent) => {
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

      if (dist > 3) {
        const count = Math.min(5, Math.max(2, Math.floor(dist / 9)))

        for (let i = 0; i < count; i++) {
          const sprayAngle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 1.2
          const speed = Math.random() * 1.2 + 0.4

          fluidParticles.push({
            x: mouse.x + (Math.random() - 0.5) * 4,
            y: mouse.y + (Math.random() - 0.5) * 4,
            vx: Math.cos(sprayAngle) * speed * 0.4,
            vy: Math.sin(sprayAngle) * speed * 0.4,
            size: Math.random() * 1.0 + 0.8,
            alpha: Math.random() * 0.25 + 0.55,
            life: 0,
            maxLife: Math.floor(Math.random() * 20 + 20),
          })
        }
      }

      if (fluidParticles.length > 50) {
        fluidParticles.splice(0, fluidParticles.length - 50)
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // ================= 1. 渲染纯黑白常驻随机浮动微尘粒子 =================
      for (let i = 0; i < ambientParticles.length; i++) {
        const ap = ambientParticles[i]
        ap.x += ap.vx
        ap.y += ap.vy

        if (ap.x < -10) ap.x = width + 10
        else if (ap.x > width + 10) ap.x = -10
        if (ap.y < -10) ap.y = height + 10
        else if (ap.y > height + 10) ap.y = -10

        ap.phase += ap.twinkleSpeed
        const currentAlpha = Math.min(0.8, Math.max(0.15, ap.baseAlpha * (0.65 + Math.sin(ap.phase) * 0.45)))

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`
        ctx.beginPath()
        ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // ================= 2. 渲染高级感方块拖尾粒子束 =================
      nextBeamTimer--
      if (nextBeamTimer <= 0 && blockBeams.length < 2) {
        spawnBlockBeam()
        nextBeamTimer = Math.floor(Math.random() * 200 + 150) // 每隔 2.5 ~ 6 秒触发一条
      }

      for (let i = blockBeams.length - 1; i >= 0; i--) {
        const beam = blockBeams[i]
        beam.life++

        // 柔和微弧线巡航运动
        beam.angle += Math.sin(beam.life * 0.035) * beam.curveSpeed
        beam.x += Math.cos(beam.angle) * beam.speed
        beam.y += Math.sin(beam.angle) * beam.speed

        // 平滑渐显与渐隐
        if (beam.life < 14) {
          beam.alpha = (beam.life / 14) * 0.95
        } else if (beam.life > beam.maxLife - 20) {
          beam.alpha = Math.max(0, ((beam.maxLife - beam.life) / 20) * 0.95)
        } else {
          beam.alpha = 0.95
        }

        // 记录历史轨迹点以生成方块拖尾 (最多保留 26 个阶梯方块)
        beam.history.unshift({ x: beam.x, y: beam.y, angle: beam.angle })
        if (beam.history.length > 26) {
          beam.history.pop()
        }

        // 偶发散落微型方块碎屑 (形成高科技数字粒子束尾流)
        if (beam.life % 4 === 0 && beam.debris.length < 12) {
          const spreadAngle = beam.angle + Math.PI + (Math.random() - 0.5) * 1.5
          beam.debris.push({
            x: beam.x,
            y: beam.y,
            vx: Math.cos(spreadAngle) * (Math.random() * 1.2 + 0.3),
            vy: Math.sin(spreadAngle) * (Math.random() * 1.2 + 0.3),
            size: Math.random() * 1.2 + 1.2, // 1.2px ~ 2.4px 小方块
            alpha: beam.alpha * 0.8,
            life: 0,
            maxLife: Math.floor(Math.random() * 18 + 14),
          })
        }

        // 越界销毁判断
        const isOutOfScreen =
          beam.x < -80 || beam.x > width + 80 || beam.y < -80 || beam.y > height + 80
        if ((beam.life >= beam.maxLife || (beam.life > 50 && isOutOfScreen)) && beam.debris.length === 0) {
          blockBeams.splice(i, 1)
          continue
        }

        // A. 绘制方块拖尾连线 (Hairline Beam Guide)
        if (beam.history.length > 1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${beam.alpha * 0.18})`
          ctx.lineWidth = 1
          ctx.beginPath()
          for (let k = 0; k < beam.history.length; k++) {
            if (k === 0) ctx.moveTo(beam.history[k].x, beam.history[k].y)
            else ctx.lineTo(beam.history[k].x, beam.history[k].y)
          }
          ctx.stroke()
        }

        // B. 绘制阶梯式方块拖尾 (Block Trail)
        for (let k = beam.history.length - 1; k >= 0; k--) {
          const pt = beam.history[k]
          const progress = k / beam.history.length // 0 为头部, 1 为尾部
          const curSize = Math.max(1.2, beam.blockSize * Math.pow(1 - progress, 0.72))
          const blockAlpha = beam.alpha * (1 - progress * 0.85)

          ctx.save()
          ctx.translate(pt.x, pt.y)
          ctx.rotate(pt.angle)

          // 纯白数码方块填充
          ctx.fillStyle = `rgba(255, 255, 255, ${blockAlpha})`
          ctx.fillRect(-curSize / 2, -curSize / 2, curSize, curSize)

          // 核心方块高光微边框
          if (curSize >= 3.0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${blockAlpha * 0.5})`
            ctx.lineWidth = 0.6
            ctx.strokeRect(-curSize / 2, -curSize / 2, curSize, curSize)
          }
          ctx.restore()
        }

        // C. 绘制伴随散落的微方块碎屑
        for (let d = beam.debris.length - 1; d >= 0; d--) {
          const deb = beam.debris[d]
          deb.life++
          deb.x += deb.vx
          deb.y += deb.vy
          const debProgress = deb.life / deb.maxLife
          const debAlpha = deb.alpha * (1 - debProgress)

          if (deb.life >= deb.maxLife || debAlpha <= 0) {
            beam.debris.splice(d, 1)
            continue
          }

          ctx.fillStyle = `rgba(255, 255, 255, ${debAlpha})`
          ctx.fillRect(deb.x - deb.size / 2, deb.y - deb.size / 2, deb.size, deb.size)
        }
      }

      // ================= 3. 渲染鼠标纯白流体微颗粒 =================
      for (let i = fluidParticles.length - 1; i >= 0; i--) {
        const p = fluidParticles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.94
        p.vy *= 0.94

        const progress = p.life / p.maxLife
        const currentAlpha = p.alpha * (1 - progress)

        if (p.life >= p.maxLife || currentAlpha <= 0) {
          fluidParticles.splice(i, 1)
          continue
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
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
