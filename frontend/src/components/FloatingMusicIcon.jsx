import { useState, useEffect } from 'react'
import { HiMusicalNote } from 'react-icons/hi2'

export default function FloatingMusicIcon() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2
      const bottomY = window.innerHeight - 180
      const distX = e.clientX - centerX
      const distY = e.clientY - bottomY
      const rotateY = (distX / window.innerWidth) * 34
      const rotateX = (distY / window.innerHeight) * -26

      setRotation({ x: rotateX, y: rotateY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      className="floating-music-icon-container"
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      }}
    >
      <div className="floating-music-icon">
        <HiMusicalNote />
      </div>
    </div>
  )
}
