import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

const ImageSlider = ({ images, autoSlideInterval = 4000, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [imageErrors, setImageErrors] = useState({})

  // Auto-slide functionality
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, autoSlideInterval)

    return () => clearInterval(interval)
  }, [images.length, autoSlideInterval, isPlaying])

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  return (
    <div className={`relative w-full h-full overflow-hidden group ${className}`}>
      {/* Images Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            {imageErrors[index] ? (
              // Fallback for broken images
              <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] via-[#2D2D2D] to-[#0F3460] flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                    <div className="text-primary text-6xl font-bold">AM</div>
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-bold">AutoMedic Workshop</p>
                  <p className="text-white/50 text-xs sm:text-sm uppercase tracking-widest mt-1">Professional Service — Lilongwe</p>
                </div>
              </div>
            ) : (
              <img
                src={image.src}
                alt={image.alt || `AutoMedic Slide ${index + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}
            
            {/* Image Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Show on hover */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
        aria-label="Previous image"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="absolute top-4 left-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
        aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-white scale-125 shadow-lg' 
                : 'bg-white/50 hover:bg-white/75 hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: '100%',
              animation: `progressBar ${autoSlideInterval}ms linear infinite`
            }}
          />
        </div>
      )}
    </div>
  )
}

// Add progress bar animation to CSS
const style = document.createElement('style')
style.textContent = `
  @keyframes progressBar {
    from { width: 0%; }
    to { width: 100%; }
  }
`
document.head.appendChild(style)

export default ImageSlider