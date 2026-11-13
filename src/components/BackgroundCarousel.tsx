import { useState, useEffect } from 'react'

interface BackgroundCarouselProps {
  images: string[]
  interval?: number
}

export default function BackgroundCarousel({
  images,
  interval = 5000,
}: BackgroundCarouselProps) {
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(0)

  /*
    Primero solo la primera imagen; las demás, cuando esa ya se ve (13/11/2026).
    Antes se pedían las seis a la vez y el huésped, con datos móviles, esperaba
    a todas antes de ver la página.
  */
  useEffect(() => {
    if (images.length === 0) return
    let vigente = true
    const primera = new Image()
    primera.onload = primera.onerror = () => {
      if (!vigente) return
      setReady(true)
      for (const src of images.slice(1)) {
        const img = new Image()
        img.src = src
      }
    }
    primera.src = images[0]
    return () => {
      vigente = false
    }
  }, [images])

  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [ready, images.length, interval])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {ready &&
        images.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 ease-out"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === active ? 1 : 0,
            }}
          />
        ))}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  )
}
