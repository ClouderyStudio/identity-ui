<script setup lang="ts">
/**
 * ParticlesBackground — port of the legacy site's ParticlesBg: a drifting field of
 * dots that is magnetically pulled towards the pointer and fades out near the
 * canvas edges. Canvas cannot resolve CSS custom properties, so the colour is
 * resolved to rgb at runtime and re-resolved whenever the theme flips.
 * prefers-reduced-motion halves the field and weakens the magnetism instead of
 * freezing it.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Number of particles (halved under prefers-reduced-motion). */
    quantity?: number
    /** Any CSS colour, including var(--…) and currentColor. */
    color?: string
    /** Higher = the field reacts less to the pointer. */
    staticity?: number
    /** Higher = the field drifts back slower. */
    ease?: number
  }>(),
  { quantity: 140, color: 'currentColor', staticity: 60, ease: 80 },
)

interface Circle {
  x: number
  y: number
  translateX: number
  translateY: number
  size: number
  alpha: number
  targetAlpha: number
  dx: number
  dy: number
  magnetism: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const count = Math.max(12, Math.round(props.quantity * (reduced ? 0.5 : 1)))
  const staticity = props.staticity * (reduced ? 1.7 : 1)

  const size = { w: 0, h: 0, dpr: 1 }
  const mouse = { x: 0, y: 0 }
  let circles: Circle[] = []
  let rgb = '110, 130, 255'
  let frame = 0
  let running = false
  let observer: ResizeObserver | null = null
  let visibility: IntersectionObserver | null = null
  let themeObserver: MutationObserver | null = null

  /** Resolve the colour prop (CSS var / currentColor included) to "r, g, b". */
  function resolveColor(): string {
    let raw = props.color
    if (raw === 'currentColor' || raw === 'currentcolor') raw = getComputedStyle(canvas!).color
    const varName = /var\(\s*(--[\w-]+)/.exec(raw)?.[1]
    const base = varName
      ? getComputedStyle(document.documentElement).getPropertyValue(varName).trim() ||
        getComputedStyle(canvas!).color
      : raw

    let r = 0
    let g = 0
    let b = 0
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(base)?.[1]
    if (hex) {
      const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
      r = parseInt(full.slice(0, 2), 16)
      g = parseInt(full.slice(2, 4), 16)
      b = parseInt(full.slice(4, 6), 16)
    } else {
      const parts = base.match(/[\d.]+/g)
      if (!parts || parts.length < 3) return '110, 130, 255'
      r = Number(parts[0])
      g = Number(parts[1])
      b = Number(parts[2])
    }
    return `${r}, ${g}, ${b}`
  }

  function params(): Circle {
    return {
      x: Math.random() * size.w,
      y: Math.random() * size.h,
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + 1,
      alpha: 0,
      targetAlpha: Number((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.22,
      dy: (Math.random() - 0.5) * 0.22,
      magnetism: 0.1 + Math.random() * 4,
    }
  }

  function paint(circle: Circle, update: boolean): void {
    const offsetX = update ? circle.translateX : 0
    const offsetY = update ? circle.translateY : 0
    ctx!.beginPath()
    ctx!.arc(circle.x + offsetX, circle.y + offsetY, circle.size, 0, Math.PI * 2)
    ctx!.fillStyle = `rgba(${rgb}, ${circle.alpha})`
    ctx!.fill()
  }

  function seed(): void {
    circles = Array.from({ length: count }, () => {
      const circle = params()
      circle.alpha = circle.targetAlpha
      return circle
    })
  }

  function resize(): void {
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    size.w = Math.max(rect.width, 1)
    size.h = Math.max(rect.height, 1)
    size.dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(size.w * size.dpr)
    canvas.height = Math.floor(size.h * size.dpr)
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    rgb = resolveColor()
    seed()
  }

  function remap(value: number, in1: number, in2: number, out1: number, out2: number): number {
    const mapped = ((value - in1) * (out2 - out1)) / (in2 - in1) + out1
    return mapped > 0 ? mapped : 0
  }

  function draw(): void {
    if (!ctx) return
    ctx.clearRect(0, 0, size.w, size.h)

    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i]
      const offsetX = circle.translateX
      const offsetY = circle.translateY

      const edge = Math.min(
        circle.x + offsetX - circle.size,
        size.w - circle.x - offsetX - circle.size,
        circle.y + offsetY - circle.size,
        size.h - circle.y - offsetY - circle.size,
      )
      const fade = Number(remap(edge, 0, 20, 0, 1).toFixed(2))

      if (fade > 1) {
        circle.alpha += 0.02
        if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha
      } else {
        circle.alpha = circle.targetAlpha * fade
      }

      circle.x += circle.dx
      circle.y += circle.dy
      circle.translateX += (mouse.x / (staticity / circle.magnetism) - circle.translateX) / props.ease
      circle.translateY += (mouse.y / (staticity / circle.magnetism) - circle.translateY) / props.ease

      if (
        circle.x < -circle.size ||
        circle.x > size.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > size.h + circle.size
      ) {
        circles[i] = params()
      } else {
        paint(circle, true)
      }
    }
  }

  function loop(): void {
    if (!running) return
    draw()
    frame = requestAnimationFrame(loop)
  }

  function start(): void {
    if (running) return
    running = true
    frame = requestAnimationFrame(loop)
  }

  function stop(): void {
    running = false
    cancelAnimationFrame(frame)
  }

  function onPointerMove(event: PointerEvent): void {
    const rect = canvas!.getBoundingClientRect()
    const x = event.clientX - rect.left - size.w / 2
    const y = event.clientY - rect.top - size.h / 2
    if (x < size.w / 2 && x > -size.w / 2 && y < size.h / 2 && y > -size.h / 2) {
      mouse.x = x
      mouse.y = y
    }
  }

  resize()
  observer = new ResizeObserver(() => {
    resize()
  })
  observer.observe(canvas)

  // Only burn frames while the hero is actually on screen.
  visibility = new IntersectionObserver(
    (entries) => (entries[0]?.isIntersecting ? start() : stop()),
    { threshold: 0 },
  )
  visibility.observe(canvas)

  themeObserver = new MutationObserver(() => {
    rgb = resolveColor()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  window.addEventListener('pointermove', onPointerMove, { passive: true })

  onBeforeUnmount(() => {
    stop()
    observer?.disconnect()
    visibility?.disconnect()
    themeObserver?.disconnect()
    window.removeEventListener('pointermove', onPointerMove)
  })
})
</script>

<template>
  <canvas ref="canvasRef" class="particles" aria-hidden="true" />
</template>

<style scoped>
.particles {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
