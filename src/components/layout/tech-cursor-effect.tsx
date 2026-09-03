'use client'

import { useEffect, useRef } from 'react'

interface TrailNode {
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

    const trailNodes: TrailNode[] = []
    let lastX = width / 2
    let lastY = height / 2

    const handleMouseMove = (e: MouseEvent) => {
      mouse.active = true
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY

      // 更新 CSS 变量以便卡片检测光标相对位置
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)

      // 计算鼠标瞬时移动距离
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY)
      mouse.speed = dist

      // 仅在移动距离超过阈值时生成跟随粒子
      if (dist > 4) {
        trailNodes.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2 + 1.2,
          alpha: 0.55,
          life: 0,
          maxLife: 28,
        })
        lastX = e.clientX
        lastY = e.clientY
      }

      // 限制节点池大小，保证 60fps 丝滑
      if (trailNodes.length > 45) {
        trailNodes.shift()
      }
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 坐标平滑插值 (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.18
      mouse.y += (mouse.targetY - mouse.y) * 0.18

      if (mouse.active) {
        // 1. 鼠标焦点核心径向光晕 (深色风低饱和度冷青灰微光，半径 280px)
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          260
        )
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.07)')
        gradient.addColorStop(0.35, 'rgba(14, 165, 233, 0.03)')
        gradient.addColorStop(0.7, 'rgba(99, 102, 241, 0.015)')
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // 2. 鼠标十字瞄准与微小几何刻度 (HUD 科技感)
        ctx.save()
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)'
        ctx.lineWidth = 1
        const crosshairSize = 6
        // 水平线
        ctx.beginPath()
        ctx.moveTo(mouse.x - crosshairSize, mouse.y)
        ctx.lineTo(mouse.x + crosshairSize, mouse.y)
        ctx.stroke()
        // 垂直线
        ctx.beginPath()
        ctx.moveTo(mouse.x, mouse.y - crosshairSize)
        ctx.lineTo(mouse.x, mouse.y + crosshairSize)
        ctx.stroke()
        ctx.restore()
      }

      // 3. 鼠标光影粒子轨迹连接线 (科技网格/星芒粒子)
      if (trailNodes.length > 1) {
        ctx.save()
        ctx.lineWidth = 0.8
        for (let i = 0; i < trailNodes.length - 1; i++) {
          const p1 = trailNodes[i]
          const p2 = trailNodes[i + 1]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)

          if (dist < 70) {
            const alpha = Math.min(p1.alpha, p2.alpha) * 0.35
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      // 4. 绘制并更新轨迹节点
      for (let i = trailNodes.length - 1; i >= 0; i--) {
        const node = trailNodes[i]
        node.life++
        node.x += node.vx
        node.y += node.vy
        node.alpha = 0.55 * (1 - node.life / node.maxLife)

        if (node.life >= node.maxLife || node.alpha <= 0) {
          trailNodes.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.fillStyle = `rgba(56, 189, 248, ${node.alpha})`
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size * (1 - node.life / (node.maxLife * 1.5)), 0, Math.PI * 2)
        ctx.fill()
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
      style={{ opacity: 0.9 }}
      aria-hidden="true"
    />
  )
}
