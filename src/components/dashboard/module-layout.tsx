'use client'

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export function DashboardModule({ id, children }: { id: string; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    const item = itemRef.current
    if (!content || !item) return

    // 测量自然内容高度，关闭模块、增删任务和窗口缩放后都能紧凑补位。
    const measure = () => {
      const span = Math.ceil((content.getBoundingClientRect().height + 24) / 4)
      item.style.setProperty('--module-rows', String(span))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={itemRef} data-dashboard-module={id} className="dashboard-module min-w-0" style={{ '--module-rows': 120 } as CSSProperties}>
      <div ref={contentRef} className="flow-root min-w-0">{children}</div>
    </div>
  )
}

export function DashboardModuleLayout({ children }: { children: ReactNode }) {
  return <div className="dashboard-module-grid">{children}</div>
}
