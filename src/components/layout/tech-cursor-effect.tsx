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

type BeamMode = 'corner' | 'loop' | 'wave'

// 高级感方块拖尾粒子束 (Block-Trail Cyber Particle Beam) - 支持高速巡航、变轨急拐弯与绕圈回旋
interface BlockTrailBeam {
  x: number
  y: number
  angle: number
  speed: number
  mode: BeamMode
  angularVelocity: number
  turnLife: number
  turnTargetAngle: number
  hasTurned: boolean
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

    // 2. 高级感高速方块拖尾粒子束发射池 (支持高速穿梭、急剧拐弯、大圆弧绕圈机动)
    const blockBeams: BlockTrailBeam[] = []
    let nextBeamTimer = Math.floor(Math.random() * 40 + 20) // 启动后迅速触发首个

    const spawnBlockBeam = () => {
      // 随机选择生成边缘：0:左, 1:顶, 2:右, 3:底
      const side = Math.floor(Math.random() * 4)
      let startX = 0
      let startY = 0
      let initialAngle = 0

      if (side === 0) {
        startX = -40
        startY = Math.random() * (height * 0.8) + height * 0.1
        initialAngle = (Math.random() - 0.5) * 0.5
      } else if (side === 1) {
        startX = Math.random() * (width * 0.8) + width * 0.1
        startY = -40
        initialAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.5
      } else if (side === 2) {
        startX = width + 40
        startY = Math.random() * (height * 0.8) + height * 0.1
        initialAngle = Math.PI + (Math.random() - 0.5) * 0.5
      } else {
        startX = Math.random() * (width * 0.8) + width * 0.1
        startY = height + 40
        initialAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
      }

      // 高速粒子束 (11.5px ~ 16.5px / 帧)
      const speed = Math.random() * 5.0 + 11.5
      const blockSize = Math.random() * 1.5 + 4.5

      // 随机机动模式：拐弯 (corner)、绕圈回旋 (loop)、波浪穿梭 (wave)
      const randMode = Math.random()
      let mode: BeamMode = 'corner'
      let angularVelocity = 0
      let turnLife = 0
      let turnTargetAngle = initialAngle

      if (randMode < 0.42) {
        // 模式 1: 高速急拐弯 - 飞行中途突然 75° ~ 105° 变轨拐弯
        mode = 'corner'
        turnLife = Math.floor(Math.random() * 16 + 14)
        const turnDir = Math.random() > 0.5 ? 1 : -1
        turnTargetAngle = initialAngle + turnDir * (Math.PI * 0.45 + Math.random() * 0.2)
      } else if (randMode < 0.8) {
        // 模式 2: 高速绕圈 - 以大角速度绕出优美的大圆弧/回旋圈后极速飞出
        mode = 'loop'
        const loopDir = Math.random() > 0.5 ? 1 : -1
        angularVelocity = loopDir * (Math.random() * 0.025 + 0.055)
      } else {
        // 模式 3: 高速波浪穿梭
        mode = 'wave'
      }

      const maxLife = Math.floor(Math.max(width, height) / speed) + 90

      blockBeams.push({
        x: startX,
        y: startY,
        angle: initialAngle,
        speed,
        mode,
        angularVelocity,
        turnLife,
        turnTargetAngle,
        hasTurned: false,
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

      // ================= 2. 渲染高级感高速方块拖尾粒子束 =================
      nextBeamTimer--
      if (nextBeamTimer <= 0 && blockBeams.length < 2) {
        spawnBlockBeam()
        nextBeamTimer = Math.floor(Math.random() * 160 + 100) // 每隔 1.6 ~ 4.3 秒触发一条高速巡航
      }

      for (let i = blockBeams.length - 1; i >= 0; i--) {
        const beam = blockBeams[i]
        beam.life++

        // 核心动力学：高速、拐弯、绕圈
        if (beam.mode === 'loop') {
          // 高速绕圈：每帧以角速度偏转角度，回旋一圈多（约 75 帧）后切向冲出
          beam.angle += beam.angularVelocity
          if (beam.life > 75) {
            beam.angularVelocity *= 0.93
          }
        } else if (beam.mode === 'corner') {
          // 高速拐弯：在 turnLife 节点迅速变轨拐弯
          if (beam.life >= beam.turnLife && !beam.hasTurned) {
            const diff = beam.turnTargetAngle - beam.angle
            beam.angle += diff * 0.26
            if (Math.abs(diff) < 0.04 || beam.life > beam.turnLife + 10) {
              beam.angle = beam.turnTargetAngle
              beam.hasTurned = true
            }
          }
        } else {
          // 高速波浪穿梭
          beam.angle += Math.sin(beam.life * 0.08) * 0.05
        }

        beam.x += Math.cos(beam.angle) * beam.speed
        beam.y += Math.sin(beam.angle) * beam.speed

        // 平滑渐显与渐隐
        if (beam.life < 10) {
          beam.alpha = (beam.life / 10) * 0.95
        } else if (beam.life > beam.maxLife - 15) {
          beam.alpha = Math.max(0, ((beam.maxLife - beam.life) / 15) * 0.95)
        } else {
          beam.alpha = 0.95
        }

        // 记录历史轨迹点以生成方块拖尾 (高速下保留 24 个阶梯方块)
        beam.history.unshift({ x: beam.x, y: beam.y, angle: beam.angle })
        if (beam.history.length > 24) {
          beam.history.pop()
        }

        // 散落微型方块碎屑 (拐弯或绕圈时伴随微小甩落碎屑)
        if (beam.life % 3 === 0 && beam.debris.length < 14) {
          const spreadAngle = beam.angle + Math.PI + (Math.random() - 0.5) * 1.6
          beam.debris.push({
            x: beam.x,
            y: beam.y,
            vx: Math.cos(spreadAngle) * (Math.random() * 1.5 + 0.5),
            vy: Math.sin(spreadAngle) * (Math.random() * 1.5 + 0.5),
            size: Math.random() * 1.2 + 1.2,
            alpha: beam.alpha * 0.8,
            life: 0,
            maxLife: Math.floor(Math.random() * 16 + 12),
          })
        }

        // 越界销毁判断
        const isOutOfScreen =
          beam.x < -100 || beam.x > width + 100 || beam.y < -100 || beam.y > height + 100
        if ((beam.life >= beam.maxLife || (beam.life > 40 && isOutOfScreen)) && beam.debris.length === 0) {
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
