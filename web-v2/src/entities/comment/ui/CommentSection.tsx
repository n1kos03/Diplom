import type React from "react"

import { useState, useEffect } from "react"
import { StarRating } from "shared/ui/rating"
import { Textarea } from "shared/ui/textarea"
import { commentRepository } from "../api"
import { ratingRepository } from "entities/rating/api"
import { userRepository } from "entities/user/api"
import type { IComment } from "../models/types"
import type { ICourseRating } from "entities/rating/model/types"
import type { IUser } from "entities/user/model/types"
import { courseRepository } from "entities/course/api"
import type { ICourse } from "entities/course/model/types"

interface CommentsSectionProps {
  authorName: string
  courseId: number
  onRatingUpdate?: (updatedCourse: ICourse) => void
}

export function CommentsSection({ authorName, courseId, onRatingUpdate }: CommentsSectionProps) {
  const [currentUser, setCurrentUser] = useState<{ nickname: string; id: number } | null>(null)
  const [comments, setComments] = useState<IComment[]>([])
  const [ratings, setRatings] = useState<ICourseRating[]>([])
  const [users, setUsers] = useState<Record<number, IUser>>({})
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasUserRated, setHasUserRated] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user.user)
      } catch (e) {
        console.error('Ошибка при парсинге данных пользователя:', e)
      }
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [commentsData, ratingsData, usersData] = await Promise.all([
          commentRepository().getCommentsByCourseId(courseId),
          ratingRepository().getAllRatings(),
          userRepository().getAllUsers()
        ])
        setComments(commentsData || [])
        setRatings((ratingsData || []).filter(rating => rating.course_id === courseId))
        
        // Преобразуем массив пользователей в объект для быстрого доступа по id
        const usersMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as Record<number, IUser>)
        setUsers(usersMap)
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        setError('Не удалось загрузить данные')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  useEffect(() => {
    const checkUserRating = async () => {
      if (!currentUser?.id) return

      try {
        const ratings = await ratingRepository().getAllRatings()
        if (!ratings) return
        
        const userRating = ratings.find(rating => 
          rating.course_id === courseId && rating.user_id === currentUser.id
        )
        setHasUserRated(!!userRating)
      } catch (err) {
        console.error('Ошибка при проверке рейтинга пользователя:', err)
      }
    }

    checkUserRating()
  }, [courseId, currentUser?.id])

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
  }

  const handleRatingChange = (rating: number) => {
    setNewRating(rating)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || hasUserRated) return

    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Отправка рейтинга:', { courseId, rating: newRating })
      // Создаем рейтинг
      const ratingResponse = await ratingRepository().createRating(courseId, {
        rating: newRating
      })
      console.log('Ответ от сервера (рейтинг):', ratingResponse)

      // Создаем комментарий
      const commentResponse = await commentRepository().createComment(courseId, {
        content: newComment
      })
      console.log('Ответ от сервера (комментарий):', commentResponse)

      // Обновляем список комментариев и рейтингов
      const [updatedComments, updatedRatings, updatedCourse] = await Promise.all([
        commentRepository().getCommentsByCourseId(courseId),
        ratingRepository().getAllRatings(),
        courseRepository().getCourseById(courseId)
      ])
      setComments(updatedComments)
      setRatings(updatedRatings.filter(rating => rating.course_id === courseId))
      
      // Обновляем курс в родительском компоненте
      if (onRatingUpdate) {
        onRatingUpdate(updatedCourse)
      }

      // Очищаем форму
      setNewComment("")
      setNewRating(5)
      setHasUserRated(true)
    } catch (err) {
      console.error('Ошибка при отправке комментария:', err)
      setError('Не удалось отправить комментарий')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="mt-12 text-center">Загрузка комментариев...</div>
  }

  if (error) {
    return <div className="mt-12 text-center text-red-500">{error}</div>
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Отзывы студентов</h2>

      {/* Add comment form */}
      {currentUser?.nickname !== authorName && !hasUserRated && (
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
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Отправка..." : "Отправить отзыв"}
          </button>
        </div>
      )}

      {hasUserRated && (
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <p className="text-blue-700">Вы уже оставили отзыв на этот курс.</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => {
            const userRating = ratings.find(rating => rating.user_id === comment.user_id)
            const user = users[comment.user_id]
            return (
              <div key={comment.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{user?.nickname || 'Неизвестный пользователь'}</h4>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          {userRating && (
                            <StarRating rating={userRating.rating} totalStars={5} />
                          )}
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-gray-500 py-4">
            Пока нет комментариев.
          </div>
        )}
      </div>
    </div>
  )
}
