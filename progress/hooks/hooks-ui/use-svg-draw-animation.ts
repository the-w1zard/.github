import { useEffect, useRef } from '#sauron'
import anime from 'animejs'

export function useSVGDrawerAnimation(__sauron_id__ = _sid()) {
    const root = useRef<HTMLElement | null>(null)

    useEffect(() => {
        const el = root.current
        if (!el) return

        const selectors = [
            'svg path',
            'svg circle',
            'svg ellipse',
            'svg line',
            'svg polyline',
            'svg polygon',
        ]

        const elements = el.querySelectorAll<SVGGeometryElement>(selectors.join(','))

        elements.forEach((shape) => {
            let length = 0

            try {
                length = shape.getTotalLength()
            } catch {
                return
            }

            shape.style.strokeDasharray = `${length}`
            shape.style.strokeDashoffset = `${length}`
            shape.style.fill = 'none'
        })

        anime({
            targets: elements,
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 1200,
            direction: 'alternate',
            loop: true,
        })
    }, [])

    return root
}
