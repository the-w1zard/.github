import { useEffect, useRef } from "#sauron"
import anime from 'animejs'

export function useLucideDrawerAnimation() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const paths = el.querySelectorAll('svg path, svg circle, svg polyline')

    paths.forEach((p: SVGPathElement) => {
      const length = p.getTotalLength()
      p.style.strokeDasharray = `${length}`
      p.style.strokeDashoffset = `${length}`
    })

    anime({
      targets: paths,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 1200,
      direction: 'alternate',
      loop: true,
    })
  }, [])

  return root
}
