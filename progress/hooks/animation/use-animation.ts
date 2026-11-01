import { createHook, HookState, getCurrentComponent } from'#the-cloud'
import { _sid } from '../_sid'

type EasingName = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce'
type AnimationStatus = 'idle' | 'running' | 'paused' | 'finished' | 'cancelled'

interface AnimationOptions {
  duration?:   number
  delay?:      number
  easing?:     EasingName | ((t: number) => number)
  iterations?: number | typeof Infinity
  direction?:  'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fill?:       'none' | 'forwards' | 'backwards' | 'both'
  onUpdate?:   (value: number) => void
  onComplete?: () => void
  onStart?:    () => void
}

type Keyframe = Record<string, number | string>

const easings: Record<EasingName, (t: number) => number> = {
  linear:        t => t,
  ease:          t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  'ease-in':     t => t * t * t,
  'ease-out':    t => 1 - Math.pow(1 - t, 3),
  'ease-in-out': t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: t => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
}

const resolveEasing = (e: EasingName | ((t: number) => number)): (t: number) => number =>
  typeof e === 'function' ? e : easings[e] ?? easings.linear

const interpolateValue = (from: number, to: number, t: number): number => from + (to - from) * t

const interpolateKeyframes = (keyframes: Keyframe[], progress: number): Keyframe => {
  if (keyframes.length === 0) return {}
  if (keyframes.length === 1) return keyframes[0]
  const segments = keyframes.length - 1
  const scaled = progress * segments
  const index = Math.min(Math.floor(scaled), segments - 1)
  const local = scaled - index
  const from = keyframes[index]
  const to = keyframes[index + 1]
  const result: Keyframe = {}
  for (const key of Object.keys(from)) {
    const f = from[key], t = to[key]
    result[key] = typeof f === 'number' && typeof t === 'number'
      ? interpolateValue(f, t, local)
      : local < 0.5 ? f : t
  }
  return result
}

const raf = typeof requestAnimationFrame !== 'undefined'
  ? requestAnimationFrame
  : (cb: (t: number) => void) => { setTimeout(() => cb(Date.now()), 16); return 0 }

const caf = typeof cancelAnimationFrame !== 'undefined'
  ? cancelAnimationFrame
  : (id: number) => clearTimeout(id)

interface AnimationHookState extends HookState {
  status:       AnimationStatus
  progress:     number
  frame:        number
  startTime:    number
  pausedAt:     number
  iteration:    number
  keyframes:    Keyframe[]
  currentFrame: Keyframe
  easeFn:       (t: number) => number
}

export function useAnimation(options: AnimationOptions = {}, __sauron_id__ = _sid()) {
  const {
    duration   = 300,
    delay      = 0,
    easing     = 'ease',
    iterations = 1,
    direction  = 'normal',
    fill       = 'none',
    onUpdate,
    onComplete,
    onStart
  } = options

  return createHook(
    'useAnimation',
    __sauron_id__,
    (): AnimationHookState => {
      const s: AnimationHookState = {
        value:        0,
        status:       'idle',
        progress:     0,
        frame:        0,
        startTime:    0,
        pausedAt:     0,
        iteration:    0,
        keyframes:    [],
        currentFrame: {},
        easeFn:       resolveEasing(easing)
      }
      s.cleanup = () => caf(s.frame)
      return s
    },
    (s: AnimationHookState, key, notify) => {
      const scheduleRender = () => notify(key)

      const tick = (now: number) => {
        if (s.status !== 'running') return
        const elapsed = now - s.startTime - delay
        if (elapsed < 0) { s.frame = raf(tick); return }

        let t = Math.min(elapsed / duration, 1)
        const iter = Math.floor(t * (iterations === Infinity ? Infinity : 1))
        const isReverse = direction === 'reverse' ||
          (direction === 'alternate' && iter % 2 === 1) ||
          (direction === 'alternate-reverse' && iter % 2 === 0)

        let progress = t % 1
        if (t >= 1 && iterations !== Infinity) progress = 1
        if (isReverse) progress = 1 - progress

        s.value    = s.easeFn(progress)
        s.progress = progress

        if (s.keyframes.length > 0) s.currentFrame = interpolateKeyframes(s.keyframes, s.value)

        onUpdate?.(s.value)
        scheduleRender()

        if (t >= 1 && iterations !== Infinity) {
          s.status = fill === 'none' ? 'idle' : 'finished'
          if (fill === 'none') { s.value = 0; s.progress = 0 }
          onComplete?.()
          scheduleRender()
          return
        }

        s.frame = raf(tick)
      }

      const play = (keyframes?: Keyframe[]) => {
        if (s.status === 'running') return
        if (keyframes) s.keyframes = keyframes
        s.status    = 'running'
        s.startTime = Date.now()
        s.iteration = 0
        onStart?.()
        s.frame = raf(tick)
        scheduleRender()
      }

      const pause = () => {
        if (s.status !== 'running') return
        s.pausedAt = Date.now()
        s.status   = 'paused'
        caf(s.frame)
        scheduleRender()
      }

      const resume = () => {
        if (s.status !== 'paused') return
        s.startTime += Date.now() - s.pausedAt
        s.status     = 'running'
        s.frame      = raf(tick)
        scheduleRender()
      }

      const stop = () => {
        caf(s.frame)
        s.status       = 'cancelled'
        s.progress     = 0
        s.value        = 0
        s.currentFrame = {}
        scheduleRender()
      }

      const seek = (progress: number) => {
        s.progress = Math.max(0, Math.min(1, progress))
        s.value    = s.easeFn(s.progress)
        if (s.keyframes.length > 0) s.currentFrame = interpolateKeyframes(s.keyframes, s.value)
        onUpdate?.(s.value)
        scheduleRender()
      }

      return {
        play,
        pause,
        resume,
        stop,
        seek,
        status:     s.status,
        progress:   s.progress,
        value:      s.value,
        frame:      s.currentFrame,
        isRunning:  s.status === 'running',
        isFinished: s.status === 'finished',
        isPaused:   s.status === 'paused',
        isIdle:     s.status === 'idle'
      }
    }
  )
}

export function useAnimatedValue(from: number, to: number, options: AnimationOptions = {}) {
  const anim = useAnimation(options)
  const start = () => anim.play()
  const current = from + (to - from) * anim.value
  return { ...anim, current, start }
}

export function useKeyframeAnimation(keyframes: Keyframe[], options: AnimationOptions = {}) {
  const anim = useAnimation(options)
  const play = () => anim.play(keyframes)
  return { ...anim, play, frame: anim.frame }
}
