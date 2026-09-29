'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// 鼠标流体拖尾粒子 (纯黑白星光)
interface FluidParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  turbPhase: number
}

// 背景常驻随机浮动微尘粒子 (纯黑白单色闪烁)
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

// 随机划过屏幕的超高速宇宙粒子束 (Collimated Particle Beam / Ray Stream)
interface ParticleBeam {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  width: number
  angle: number
  alpha: number
  life: number
  maxLife: number
  particles: {
    offset: number
    lateralOffset: number
    size: number
    alpha: number
  }[]
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

    // 1. 初始化纯黑白常驻随机浮动星尘粒子（38 颗精简配置，纯粹黑白闪烁，安静深空）
    const ambientParticles: AmbientParticle[] = []
    const TOTAL_STARS = 38

    for (let i = 0; i < TOTAL_STARS; i++) {
      const size = Math.random() * 1.1 + 0.9 // 0.9px ~ 2.0px 细腻纯白星点
      const baseAlpha = Math.random() * 0.35 + 0.35

      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: Math.random() * 0.02 + 0.012,
        phase: Math.random() * Math.PI * 2,
      })
    }

    // 2. 随机高能粒子束发射池 (每隔 3~6 秒随机划过屏幕)
    const particleBeams: ParticleBeam[] = []
    let nextBeamTimer = Math.floor(Math.random() * 100 + 60) // 初始 1~2.5 秒触发首个粒子束

    const spawnParticleBeam = () => {
      // 粒子束以 30° ~ 55° 倾角斜向射穿屏幕，速度极快 (18 ~ 26px/帧)
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35
      const speed = Math.random() * 8 + 18
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed
      const length = Math.random() * 140 + 160 // 160px ~ 300px 聚束长度
      const widthVal = Math.random() * 0.7 + 1.2 // 1.2px ~ 1.9px 纤细高光束

      // 从屏幕顶部或左上方边缘射出
      const startX = Math.random() * (width + 300) - 150
      const startY = Math.random() * -100 - 50

      // 伴生微粒子：沿着粒子束管道伴飞的微型高能微粒
      const beamParticles = []
      const pCount = Math.floor(Math.random() * 4 + 6) // 6 ~ 9 颗微粒子
      for (let j = 0; j < pCount; j++) {
        beamParticles.push({
          offset: Math.random() * length * 0.88,
          lateralOffset: (Math.random() - 0.5) * 3.5,
          size: Math.random() * 1.0 + 0.7,
          alpha: Math.random() * 0.4 + 0.6,
        })
      }

      particleBeams.push({
        x: startX,
        y: startY,
        vx,
        vy,
        length,
        width: widthVal,
        angle,
        alpha: 0,
        life: 0,
        maxLife: Math.floor(Math.max(width, height) / speed) + 20,
        particles: beamParticles,
      })
    }

    // 3. 鼠标坐标追踪与纯黑白流体粒子发射池
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      active: false,
    }

    const fluidParticles: FluidParticle[] = []

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

      // 只要鼠标有移动，顺滑释放纯白星尘微流体粒子
      if (dist > 2) {
        const count = Math.min(6, Math.max(2, Math.floor(dist / 8)))

        for (let i = 0; i < count; i++) {
          const sprayAngle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 1.2
          const speed = Math.random() * 1.4 + 0.4

          fluidParticles.push({
            x: mouse.x + (Math.random() - 0.5) * 5,
            y: mouse.y + (Math.random() - 0.5) * 5,
            vx: Math.cos(sprayAngle) * speed * 0.4 + (Math.random() - 0.5) * 0.5,
            vy: Math.sin(sprayAngle) * speed * 0.4 + (Math.random() - 0.5) * 0.5,
            size: Math.random() * 1.2 + 0.9, // 精致微细纯白粒子
            alpha: Math.random() * 0.3 + 0.6,
            life: 0,
            maxLife: Math.floor(Math.random() * 20 + 25),
            turbPhase: Math.random() * Math.PI * 2,
          })
        }
      }

      if (fluidParticles.length > 70) {
        fluidParticles.splice(0, fluidParticles.length - 70)
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // ================= 1. 渲染纯黑白常驻随机浮动星尘粒子 =================
      for (let i = 0; i < ambientParticles.length; i++) {
        const ap = ambientParticles[i]
        ap.x += ap.vx
        ap.y += ap.vy

        // 视口边缘自然循环环绕
        if (ap.x < -10) ap.x = width + 10
        else if (ap.x > width + 10) ap.x = -10
        if (ap.y < -10) ap.y = height + 10
        else if (ap.y > height + 10) ap.y = -10

        // 纯黑白微闪呼吸
        ap.phase += ap.twinkleSpeed
        const currentAlpha = Math.min(0.85, Math.max(0.18, ap.baseAlpha * (0.65 + Math.sin(ap.phase) * 0.45)))

        // 核心星点
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`
        ctx.beginPath()
        ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // ================= 2. 渲染高能粒子束 (Particle Beam Stream) =================
      nextBeamTimer--
      if (nextBeamTimer <= 0 && particleBeams.length < 2) {
        spawnParticleBeam()
        nextBeamTimer = Math.floor(Math.random() * 220 + 160) // 160 ~ 380 帧 (~2.5 ~ 6 秒)
      }

      for (let i = particleBeams.length - 1; i >= 0; i--) {
        const beam = particleBeams[i]
        beam.life++
        beam.x += beam.vx
        beam.y += beam.vy

        // 平滑渐入与渐出
        if (beam.life < 8) {
          beam.alpha = (beam.life / 8) * 0.9
        } else if (beam.life > beam.maxLife - 15) {
          beam.alpha = Math.max(0, ((beam.maxLife - beam.life) / 15) * 0.9)
        } else {
          beam.alpha = 0.9
        }

        // 越过视口或生命终结
        if (beam.life >= beam.maxLife || beam.x > width + 400 || beam.y > height + 400 || beam.alpha <= 0) {
          particleBeams.splice(i, 1)
          continue
        }

        const tailX = beam.x - Math.cos(beam.angle) * beam.length
        const tailY = beam.y - Math.sin(beam.angle) * beam.length

        // A. 粒子束核心高光流线 (Collimated Beam Core)
        const beamGrad = ctx.createLinearGradient(beam.x, beam.y, tailX, tailY)
        beamGrad.addColorStop(0, `rgba(255, 255, 255, ${beam.alpha})`)
        beamGrad.addColorStop(0.12, `rgba(255, 255, 255, ${beam.alpha * 0.85})`)
        beamGrad.addColorStop(0.55, `rgba(255, 255, 255, ${beam.alpha * 0.25})`)
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.strokeStyle = beamGrad
        ctx.lineWidth = beam.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(beam.x, beam.y)
        ctx.stroke()

        // B. 粒子束头部高亮发光节点 (Luminous Beam Head)
        const headGlow = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, 6)
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${beam.alpha * 0.95})`)
        headGlow.addColorStop(0.4, `rgba(255, 255, 255, ${beam.alpha * 0.35})`)
        headGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = headGlow
        ctx.beginPath()
        ctx.arc(beam.x, beam.y, 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255, 255, 255, ${beam.alpha})`
        ctx.beginPath()
        ctx.arc(beam.x, beam.y, 1.8, 0, Math.PI * 2)
        ctx.fill()

        // C. 沿粒子束管道伴随喷射的微粒子群 (Micro Particle Cluster)
        for (let j = 0; j < beam.particles.length; j++) {
          const bp = beam.particles[j]
          const px = beam.x - Math.cos(beam.angle) * bp.offset + Math.sin(beam.angle) * bp.lateralOffset
          const py = beam.y - Math.sin(beam.angle) * bp.offset - Math.cos(beam.angle) * bp.lateralOffset

          const pAlpha = beam.alpha * bp.alpha * (1 - bp.offset / beam.length)
          if (pAlpha > 0.05) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`
            ctx.beginPath()
            ctx.arc(px, py, bp.size, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // ================= 3. 渲染鼠标纯黑白流体拖尾 (Fluid Particle Stream) =================
      for (let i = fluidParticles.length - 1; i >= 0; i--) {
        const p = fluidParticles[i]
        p.life++

        p.turbPhase += 0.12
        p.x += p.vx + Math.sin(p.turbPhase) * 0.3
        p.y += p.vy + Math.cos(p.turbPhase) * 0.3
        p.vx *= 0.94
        p.vy *= 0.94

        const progress = p.life / p.maxLife
        const currentAlpha = p.alpha * (1 - progress)

        if (p.life >= p.maxLife || currentAlpha <= 0) {
          fluidParticles.splice(i, 1)
          continue
        }

        const currentSize = p.size * (1 - progress * 0.3)

        // 纯白高光微核
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.85})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // ================= 4. 鼠标焦点纯白微准星 =================
      if (!isCareerPage && mouse.active && mouse.x > 0 && mouse.y > 0) {
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
