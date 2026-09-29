'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// 背景微尘星光 (纯黑白极简)
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

// 悬浮数码晶格方块 (Cyber Cube / Digital Square Voxel - 大一点且带呼吸闪烁)
interface CyberCube {
  x: number
  y: number
  vx: number
  vy: number
  size: number // 8px ~ 18px 几何线框方块
  rotation: number
  rotationSpeed: number
  baseAlpha: number
  alpha: number
  twinkleSpeed: number
  phase: number
  hasCenterDot: boolean
}

// 随机穿越屏幕的巡航数码方块 (Cruising Cyber Block - 离散高科技残影，绝非连串毛毛虫)
interface CruisingBlock {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  size: number // 14px ~ 22px
  alpha: number
  life: number
  maxLife: number
  // 离散的原地消散全息残影 (Echo Keyframes)
  echoes: {
    x: number
    y: number
    rotation: number
    size: number
    alpha: number
    life: number
    maxLife: number
  }[]
}

// 鼠标微流体粒子
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

    // 1. 初始化纯黑白微星尘 (25 颗极简白点，衬托深空)
    const ambientParticles: AmbientParticle[] = []
    const TOTAL_STARS = 25
    for (let i = 0; i < TOTAL_STARS; i++) {
      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        size: Math.random() * 0.9 + 0.8,
        baseAlpha: Math.random() * 0.3 + 0.25,
        alpha: 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      })
    }

    // 2. 初始化常驻悬浮数码方块 (6 ~ 8 个稍大一些的纯几何线框方块，缓慢自转与呼吸闪烁)
    const cyberCubes: CyberCube[] = []
    const CUBE_COUNT = 7
    for (let i = 0; i < CUBE_COUNT; i++) {
      cyberCubes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 8 + 9, // 9px ~ 17px 大方块
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        baseAlpha: Math.random() * 0.25 + 0.25,
        alpha: 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.012,
        phase: Math.random() * Math.PI * 2,
        hasCenterDot: Math.random() > 0.3,
      })
    }

    // 3. 随机穿越屏幕的巡航数码方块 (每隔 3~6 秒，一个高级几何方块巡航穿越屏幕，带离散残影)
    const cruisingBlocks: CruisingBlock[] = []
    let nextCruisingTimer = Math.floor(Math.random() * 80 + 40)

    const spawnCruisingBlock = () => {
      const side = Math.floor(Math.random() * 4)
      let startX = 0
      let startY = 0
      let angle = 0

      if (side === 0) {
        // 从左往右
        startX = -40
        startY = Math.random() * height
        angle = (Math.random() - 0.5) * 0.5
      } else if (side === 1) {
        // 从顶往下
        startX = Math.random() * width
        startY = -40
        angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5
      } else if (side === 2) {
        // 从右往左
        startX = width + 40
        startY = Math.random() * height
        angle = Math.PI + (Math.random() - 0.5) * 0.5
      } else {
        // 对角穿越
        startX = Math.random() * (width * 0.4) - 30
        startY = -30
        angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3
      }

      const speed = Math.random() * 1.5 + 3.8 // 3.8 ~ 5.3 px/frame 稳定优雅巡航
      const size = Math.random() * 6 + 14 // 14px ~ 20px 醒目高级大方块

      cruisingBlocks.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        size,
        alpha: 0,
        life: 0,
        maxLife: Math.floor(Math.max(width, height) / speed) + 50,
        echoes: [],
      })
    }

    // 4. 鼠标纯白微粒子
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
        const count = Math.min(4, Math.max(2, Math.floor(dist / 10)))
        for (let i = 0; i < count; i++) {
          const sprayAngle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 1.2
          const speed = Math.random() * 1.2 + 0.4

          fluidParticles.push({
            x: mouse.x + (Math.random() - 0.5) * 4,
            y: mouse.y + (Math.random() - 0.5) * 4,
            vx: Math.cos(sprayAngle) * speed * 0.35,
            vy: Math.sin(sprayAngle) * speed * 0.35,
            size: Math.random() * 0.9 + 0.8,
            alpha: Math.random() * 0.25 + 0.5,
            life: 0,
            maxLife: Math.floor(Math.random() * 18 + 18),
          })
        }
      }

      if (fluidParticles.length > 40) {
        fluidParticles.splice(0, fluidParticles.length - 40)
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // ================= 1. 渲染微星尘 =================
      for (let i = 0; i < ambientParticles.length; i++) {
        const ap = ambientParticles[i]
        ap.x += ap.vx
        ap.y += ap.vy

        if (ap.x < -10) ap.x = width + 10
        else if (ap.x > width + 10) ap.x = -10
        if (ap.y < -10) ap.y = height + 10
        else if (ap.y > height + 10) ap.y = -10

        ap.phase += ap.twinkleSpeed
        const currentAlpha = Math.min(0.75, Math.max(0.12, ap.baseAlpha * (0.65 + Math.sin(ap.phase) * 0.45)))

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`
        ctx.beginPath()
        ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // ================= 2. 渲染常驻大号数码晶格方块 (呼吸闪烁 + 缓慢自转) =================
      for (let i = 0; i < cyberCubes.length; i++) {
        const cube = cyberCubes[i]
        cube.x += cube.vx
        cube.y += cube.vy
        cube.rotation += cube.rotationSpeed

        if (cube.x < -30) cube.x = width + 30
        else if (cube.x > width + 30) cube.x = -30
        if (cube.y < -30) cube.y = height + 30
        else if (cube.y > height + 30) cube.y = -30

        cube.phase += cube.twinkleSpeed
        const cubeAlpha = Math.min(0.7, Math.max(0.1, cube.baseAlpha * (0.6 + Math.sin(cube.phase) * 0.45)))

        ctx.save()
        ctx.translate(cube.x, cube.y)
        ctx.rotate(cube.rotation)

        // 半透明方块底色
        ctx.fillStyle = `rgba(255, 255, 255, ${cubeAlpha * 0.05})`
        ctx.fillRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size)

        // 纯白纤细方块线框 (0.8px 极细科技感)
        ctx.strokeStyle = `rgba(255, 255, 255, ${cubeAlpha * 0.55})`
        ctx.lineWidth = 0.8
        ctx.strokeRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size)

        // 方块中心发光微核点
        if (cube.hasCenterDot) {
          ctx.fillStyle = `rgba(255, 255, 255, ${cubeAlpha * 0.9})`
          ctx.fillRect(-1, -1, 2, 2)
        }

        ctx.restore()
      }

      // ================= 3. 渲染随机巡航大数码方块 (带离散全息残影，绝非连串毛毛虫) =================
      nextCruisingTimer--
      if (nextCruisingTimer <= 0 && cruisingBlocks.length < 2) {
        spawnCruisingBlock()
        nextCruisingTimer = Math.floor(Math.random() * 220 + 160) // 每隔 2.5 ~ 6 秒巡航一个
      }

      for (let i = cruisingBlocks.length - 1; i >= 0; i--) {
        const block = cruisingBlocks[i]
        block.life++
        block.x += block.vx
        block.y += block.vy
        block.rotation += block.rotationSpeed

        // 平滑渐显与渐隐
        if (block.life < 14) {
          block.alpha = (block.life / 14) * 0.9
        } else if (block.life > block.maxLife - 18) {
          block.alpha = Math.max(0, ((block.maxLife - block.life) / 18) * 0.9)
        } else {
          block.alpha = 0.9
        }

        // 每隔 14 帧在原地释放一个离散全息光波残影 (原地停留渐隐，非粘连拖尾)
        if (block.life % 14 === 0 && block.echoes.length < 5) {
          block.echoes.push({
            x: block.x,
            y: block.y,
            rotation: block.rotation,
            size: block.size,
            alpha: block.alpha * 0.55,
            life: 0,
            maxLife: 28,
          })
        }

        // 渲染残影 (全息渐隐方块)
        for (let e = block.echoes.length - 1; e >= 0; e--) {
          const echo = block.echoes[e]
          echo.life++
          const echoProgress = echo.life / echo.maxLife
          const currentEchoAlpha = echo.alpha * (1 - echoProgress)

          if (echo.life >= echo.maxLife || currentEchoAlpha <= 0) {
            block.echoes.splice(e, 1)
            continue
          }

          ctx.save()
          ctx.translate(echo.x, echo.y)
          ctx.rotate(echo.rotation)
          ctx.strokeStyle = `rgba(255, 255, 255, ${currentEchoAlpha * 0.4})`
          ctx.lineWidth = 0.8
          ctx.strokeRect(-echo.size / 2, -echo.size / 2, echo.size, echo.size)
          ctx.restore()
        }

        // 越界销毁
        const isOut =
          block.x < -80 || block.x > width + 80 || block.y < -80 || block.y > height + 80
        if (block.life >= block.maxLife || (block.life > 40 && isOut)) {
          cruisingBlocks.splice(i, 1)
          continue
        }

        // 渲染巡航主方块 (科技数码立方体外观)
        ctx.save()
        ctx.translate(block.x, block.y)
        ctx.rotate(block.rotation)

        // 半透明填充
        ctx.fillStyle = `rgba(255, 255, 255, ${block.alpha * 0.08})`
        ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size)

        // 纯白高光线框
        ctx.strokeStyle = `rgba(255, 255, 255, ${block.alpha * 0.85})`
        ctx.lineWidth = 1.0
        ctx.strokeRect(-block.size / 2, -block.size / 2, block.size, block.size)

        // 中心高光微核
        ctx.fillStyle = `rgba(255, 255, 255, ${block.alpha * 0.95})`
        ctx.fillRect(-1.5, -1.5, 3, 3)

        // 四角数码微标尺
        const tickLen = 2.5
        ctx.strokeStyle = `rgba(255, 255, 255, ${block.alpha * 0.6})`
        ctx.lineWidth = 0.7
        ctx.strokeRect(-block.size / 2 - tickLen, -block.size / 2 - tickLen, tickLen, tickLen)
        ctx.strokeRect(block.size / 2, block.size / 2, tickLen, tickLen)

        ctx.restore()
      }

      // ================= 4. 渲染鼠标微颗粒 =================
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
