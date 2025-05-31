import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Header } from "widgets/header"
import { courseRepository } from "entities/course/api"
import { userRepository } from "entities/user/api"
import { MoveLeft } from "lucide-react"
import type { IUserAnswer, ITaskReview, ICourseTask, ICourse } from "entities/course/model/types"
import type { IUser } from "entities/user/model/types"

interface AnswerWithReview extends IUserAnswer {
    review?: ITaskReview | null
    user: IUser | null
}

interface ReviewFormState {
    comment: string
    grade: string
}

export const ReviewAnswers = () => {
    const { taskId } = useParams<{ taskId: string }>()
    const navigate = useNavigate()
    const [answers, setAnswers] = useState<AnswerWithReview[]>([])
    const [task, setTask] = useState<ICourseTask | null>(null)
    const [course, setCourse] = useState<ICourse | null>(null)
    const [currentUser, setCurrentUser] = useState<IUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reviewForms, setReviewForms] = useState<Record<number, ReviewFormState>>({})
    const [submitting, setSubmitting] = useState<Record<number, boolean>>({})
    const [editMode, setEditMode] = useState<Record<number, boolean>>({})

    useEffect(() => {
        // Получаем текущего пользователя из localStorage
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const userData = JSON.parse(userStr)
                setCurrentUser(userData.user)
            } catch (e) {
                console.error('Ошибка при парсинге данных пользователя:', e)
            }
        }
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!taskId) return

            try {
                setIsLoading(true)
                
                // Get task details
                const taskData = await courseRepository().getTaskById(Number(taskId))
                setTask(taskData)

                // Get course details
                const courseId = window.location.pathname.split('/')[2]
                const courseData = await courseRepository().getCourseById(Number(courseId))
                setCourse(courseData)

                // Сохраняем информацию о курсе в localStorage для использования в API
                localStorage.setItem(`course_${courseId}`, JSON.stringify(courseData))

                // Get all answers for this task
                const answersData = await courseRepository().getAnswers(Number(taskId))
                
                // Get reviews and user info for each answer
                const answersWithReviews = await Promise.all(
                    answersData.map(async (answer) => {
                        const [review, user] = await Promise.all([
                            courseRepository().getReview(answer.id),
                            userRepository().getUserById(answer.user_id)
                        ])

                        // Initialize review form state for this answer
                        setReviewForms(prev => ({
                            ...prev,
                            [answer.id]: {
                                comment: review?.author_comment || '',
                                grade: review?.grade?.toString() || ''
                            }
                        }))

                        return {
                            ...answer,
                            review,
                            user
                        }
                    })
                )
                
                setAnswers(answersWithReviews)
            } catch (err) {
                console.error('Error fetching data:', err)
                setError('Failed to load data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [taskId])

    const handleReviewFormChange = (answerId: number, field: keyof ReviewFormState, value: string) => {
        if (field === 'grade') {
            // Проверяем, что значение является числом от 1 до 5
            const numValue = parseInt(value)
            if (isNaN(numValue) || numValue < 1 || numValue > 5) {
                return
            }
        }

        setReviewForms(prev => ({
            ...prev,
            [answerId]: {
                ...prev[answerId],
                [field]: value
            }
        }))
    }

    const handleSubmitReview = async (answerId: number) => {
        const form = reviewForms[answerId]
        if (!form) return

        try {
            setSubmitting(prev => ({ ...prev, [answerId]: true }))

            const answer = answers.find(a => a.id === answerId)
            if (!answer) return

            const reviewData = {
                grade: parseInt(form.grade) || 0,
                author_comment: form.comment
            }

            let review
            if (answer.review) {
                // Обновляем существующий отзыв
                review = await courseRepository().updateReview(answerId, answer.review.id, reviewData)
            } else {
                // Создаем новый отзыв
                review = await courseRepository().createReview(answerId, reviewData)
            }

            // Update the answers state to reflect the new/updated review
            setAnswers(answers.map(answer => 
                answer.id === answerId 
                    ? { 
                        ...answer, 
                        review: {
                            id: review.id,
                            answer_id: answerId,
                            grade: parseInt(form.grade) || 0,
                            author_comment: form.comment,
                            created_at: new Date().toISOString()
                        }
                    }
                    : answer
            ))

            // Выключаем режим редактирования
            setEditMode(prev => ({
                ...prev,
                [answerId]: false
            }))
        } catch (err) {
            console.error('Error saving review:', err)
        } finally {
            setSubmitting(prev => ({ ...prev, [answerId]: false }))
        }
    }

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center">Загрузка ответов...</div>
                </div>
            </>
        )
    }

    if (error || !task || !course || !currentUser) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center text-red-500">
                        {error || 'Недостаточно данных для отображения страницы'}
                    </div>
                </div>
            </>
        )
    }

    const isAuthor = currentUser.id === course.author_id

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Breadcrumb */}
                <div className="flex gap-2 items-center text-sm text-gray-500 mb-4 cursor-pointer"
                     onClick={() => navigate(-1)}>
                    <MoveLeft className="w-4 h-4" />
                    <span>Вернуться к заданию</span>
                </div>

                <h1 className="text-2xl font-bold mb-6">
                    {isAuthor ? 'Ответы на задание: ' : 'Мой ответ на задание: '}
                    {task.title}
                </h1>

                {answers.length === 0 ? (
                    <div className="text-center text-gray-500">
                        {isAuthor ? 'Пока нет ответов на это задание' : 'Вы еще не дали ответ на это задание'}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {answers.map((answer) => {
                            const form = reviewForms[answer.id] || { comment: '', grade: '' }
                            const isSubmitting = submitting[answer.id] || false
                            const isEditing = editMode[answer.id] || false

                            return (
                                <div key={answer.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-medium">{answer.user?.nickname || 'Неизвестный пользователь'}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(answer.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* File Preview */}
                                    <div className="mb-4">
                                        <div className="aspect-video max-h-[200px] min-w-[300px] rounded-md overflow-hidden bg-gray-100">
                                            {answer.content_url.toLowerCase().endsWith('.mp4') || 
                                             answer.content_url.toLowerCase().endsWith('.webm') || 
                                             answer.content_url.toLowerCase().endsWith('.mov') ? (
                                                <video
                                                    src={answer.content_url}
                                                    controls
                                                    preload="metadata"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Ошибка загрузки видео:', e);
                                                    }}
                                                />
                                            ) : answer.content_url.toLowerCase().endsWith('.png') || 
                                               answer.content_url.toLowerCase().endsWith('.jpg') || 
                                               answer.content_url.toLowerCase().endsWith('.jpeg') ? (
                                                <img
                                                    src={answer.content_url}
                                                    alt="Ответ студента"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => console.error('Ошибка загрузки изображения:', e)}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <a 
                                                        href={answer.content_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                                                    >
                                                        <span>Открыть файл</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isAuthor && (
                                        <div className="space-y-4">
                                            {isEditing ? (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Комментарий к ответу
                                                        </label>
                                                        <textarea
                                                            className="w-full p-2 border rounded-md"
                                                            rows={3}
                                                            value={form.comment}
                                                            onChange={(e) => handleReviewFormChange(answer.id, 'comment', e.target.value)}
                                                            placeholder="Добавьте комментарий к ответу..."
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                    <div className="flex items-end gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Оценка (от 1 до 5)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="5"
                                                                className="w-24 p-2 border rounded-md"
                                                                value={form.grade}
                                                                onChange={(e) => handleReviewFormChange(answer.id, 'grade', e.target.value)}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className={`px-4 py-2 rounded-md text-white font-medium ${
                                                                    isSubmitting 
                                                                        ? 'bg-gray-400 cursor-not-allowed' 
                                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                                }`}
                                                                onClick={() => handleSubmitReview(answer.id)}
                                                                disabled={isSubmitting}
                                                            >
                                                                {isSubmitting ? 'Сохранение...' : 'Сохранить отзыв'}
                                                            </button>
                                                            <button
                                                                className="px-4 py-2 rounded-md text-gray-600 font-medium border hover:bg-gray-50"
                                                                onClick={() => {
                                                                    setEditMode(prev => ({
                                                                        ...prev,
                                                                        [answer.id]: false
                                                                    }))
                                                                    // Восстанавливаем предыдущие значения
                                                                    setReviewForms(prev => ({
                                                                        ...prev,
                                                                        [answer.id]: {
                                                                            comment: answer.review?.author_comment || '',
                                                                            grade: answer.review?.grade?.toString() || ''
                                                                        }
                                                                    }))
                                                                }}
                                                                disabled={isSubmitting}
                                                            >
                                                                Отмена
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                                {answer.review ? 'Ваш отзыв:' : 'Отзыв еще не добавлен'}
                                                            </h4>
                                                            {answer.review && (
                                                                <>
                                                                    <p className="text-sm text-gray-600">{answer.review.author_comment}</p>
                                                                    <p className="text-sm text-gray-600 mt-1">Оценка: {answer.review.grade}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                        <button
                                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                                            onClick={() => setEditMode(prev => ({
                                                                ...prev,
                                                                [answer.id]: true
                                                            }))}
                                                        >
                                                            {answer.review ? 'Изменить отзыв' : 'Добавить отзыв'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
} 