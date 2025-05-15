import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  totalStars: number
  onRatingChange?: (rating: number) => void
}

export const StarRating = ({ rating, totalStars = 5, onRatingChange }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const getStarFill = (starPosition: number) => {
    if (isHovering) {
      return starPosition <= hoverRating ? 100 : 0
    }

    const difference = rating - starPosition + 1
    if (difference >= 1) return 100
    if (difference <= 0) return 0
    return Math.round(difference * 100)
  }

  const handleMouseEnter = (starPosition: number) => {
    if (!onRatingChange) return
    setIsHovering(true)
    setHoverRating(starPosition)
  }

  const handleMouseLeave = () => {
    if (!onRatingChange) return
    setIsHovering(false)
    setHoverRating(0)
  }

  const handleClick = (starPosition: number) => {
    if (!onRatingChange) return
    onRatingChange(starPosition)
  }

  return (
    <div className="flex">
      {[...Array(totalStars)].map((_, index) => {
        const starPosition = index + 1
        const fillPercentage = getStarFill(starPosition)

        return (
          <div
            key={index}
            className={`relative cursor-${onRatingChange ? "pointer" : "default"}`}
            onMouseEnter={() => handleMouseEnter(starPosition)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starPosition)}
          >
            <Star className="w-5 h-5 text-gray-300" />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
              <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
