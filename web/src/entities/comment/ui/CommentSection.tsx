import type React from "react"

import { useState } from "react"
import { StarRating } from "shared/ui/rating"
import { Textarea } from "shared/ui/textarea"
interface Comment {
  id: string
  userName: string
  userInitials: string
  userImage?: string
  date: string
  rating: number
  content: string
  likes: number
  dislikes: number
  userLiked?: boolean
  userDisliked?: boolean
}

export function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      userName: "Артем Ребрик",
      userInitials: "СД",
      userImage: "/placeholder.svg?height=40&width=40",
      date: "2 месяца назад",
      rating: 5,
      content:
        "Этот курс превзошел все мои ожидания! Преподаватель объясняет сложные концепции UI/UX так, что их легко понять. Практические проекты действительно помогли мне применить полученные знания. Очень рекомендую всем, кто хочет начать карьеру в этой области.",
      likes: 24,
      dislikes: 2,
    },
    {
      id: "2",
      userName: "Михаил Иванов",
      userInitials: "МЧ",
      date: "3 недели назад",
      rating: 4,
      content:
        "В целом отличный курс. Особенно полезными были уроки по Figma. Хотелось бы больше контента о методах исследования пользователей, но принципы дизайна были хорошо раскрыты. Преподаватель компетентен и быстро отвечает на вопросы.",
      likes: 15,
      dislikes: 1,
    },
    {
      id: "3",
      userName: "Александр Иванов",
      userInitials: "АИ",
      date: "1 месяц назад",
      rating: 4,
      content:
        "Хорошее введение в UI/UX дизайн. Некоторые разделы показались слишком сжатыми, особенно в 4-й неделе. Проекты были интересными, но хотелось бы более подробной обратной связи. Тем не менее, я многому научился и теперь чувствую себя увереннее в своих навыках дизайна.",
      likes: 8,
      dislikes: 3,
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
  }

  const handleRatingChange = (rating: number) => {
    setNewRating(rating)
  }

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        userName: "Вы",
        userInitials: "Вы",
        date: "Только что",
        rating: newRating,
        content: newComment,
        likes: 0,
        dislikes: 0,
      }

      setComments([newCommentObj, ...comments])
      setNewComment("")
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Отзывы студентов</h2>

      {/* Add comment form */}
      <div className="bg-gray-100 p-6 rounded-2xl mb-8">
        <h3 className="text-lg font-semibold mb-4">Добавить отзыв</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ваш рейтинг</label>
          <StarRating rating={newRating} totalStars={5} onRatingChange={handleRatingChange} />
        </div>
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Ваш отзыв
          </label>
          <Textarea
            id="comment"
            placeholder="Поделитесь своим опытом с этим курсом..."
            value={newComment}
            onChange={handleCommentChange}
            rows={4}
            className="mt-3 bg-white border-none resize-none"
          />
        </div>
        <button
          onClick={handleSubmitComment}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          {isSubmitting ? "Отправка..." : "Отправить отзыв"}
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 pb-6">
            <div className="flex items-start gap-4">
              {/* <Avatar className="h-10 w-10">
                <AvatarImage src={comment.userImage || "/placeholder.svg"} alt={comment.userName} />
                <AvatarFallback>{comment.userInitials}</AvatarFallback>
              </Avatar> */}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{comment.userName}</h4>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <StarRating rating={comment.rating} totalStars={5} />
                      <span>{comment.date}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-gray-700">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
