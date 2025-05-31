import { useEffect, useState } from "react"
import { MoveLeft } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "shared/ui/accordion"
import { StarRating } from "shared/ui/rating"
import { CommentsSection } from "entities/comment"
import { Link, useParams } from "react-router-dom"
import { Header } from "widgets/header"
import { courseRepository } from "entities/course/api"
import { ratingRepository } from "entities/rating/api"
import type { ICourse, ISection, ICourseMaterial, ICourseTask } from "entities/course/model/types"
import type { ISubscription, IUserAnswer, ITaskReview } from "entities/course/model/types"

export const Course = () => {
    const { id } = useParams<{ id: string }>()
    const [course, setCourse] = useState<ICourse | null>(null)
    const [sections, setSections] = useState<ISection[]>([])
    const [materials, setMaterials] = useState<ICourseMaterial[]>([])
    const [tasks, setTasks] = useState<ICourseTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<{ nickname: string } | null>(null)
    const [subscription, setSubscription] = useState<ISubscription | null>(null)
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

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
        const fetchCourseData = async () => {
            if (!id) return
            
            try {
                setIsLoading(true)
                // Получаем основную информацию о курсе
                const courseData = await courseRepository().getCourseById(Number(id))
                setCourse(courseData)

                // Получаем секции курса
                const sectionsData = await courseRepository().getSections(Number(id))
                setSections(sectionsData.sort((a, b) => a.order_number - b.order_number))

                // Получаем материалы и задания для каждой секции
                const materialsData = await courseRepository().getMaterials(Number(id))
                const tasksData = await courseRepository().getTasks(Number(id))

                // Объединяем все материалы и задания
                setMaterials(materialsData)
                setTasks(tasksData)

                // Получаем рейтинг курса
                try {
                    await ratingRepository().getAllRatings()
                    // Рейтинг теперь хранится в объекте course
                } catch (err) {
                    console.error('Ошибка при загрузке рейтинга:', err)
                }

                // Получаем подписку
                try {
                    const subscriptions = await courseRepository().getSubscriptions()
                    // Проверяем подписку только для текущего пользователя
                    const userStr = localStorage.getItem('user')
                    if (userStr && subscriptions) {
                        const user = JSON.parse(userStr)
                        const courseSubscription = subscriptions.find(s => 
                            s.course_id === Number(id) && 
                            s.user_id === user.user.id
                        )
                        setSubscription(courseSubscription || null)
                    }

                    // Получаем количество подписчиков
                    const subscribersCount = await courseRepository().getSubscribersCount(Number(id))
                    setCourse(prev => prev ? {
                        ...prev,
                        subscribers_count: subscribersCount
                    } : null)
                } catch (err) {
                    console.error('Ошибка при загрузке подписки:', err)
                }

            } catch (err) {
                console.error('Ошибка при загрузке данных курса:', err)
                setError('Не удалось загрузить информацию о курсе')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseData()
    }, [id])

    const handleSubscribe = async () => {
        if (!id || !currentUser) {
            setNotification({
                type: 'error',
                message: 'Необходимо войти в систему для подписки на курс'
            })
            return
        }

        try {
            setIsSubscribing(true)
            if (subscription) {
                await courseRepository().unsubscribeFromCourse(Number(id))
                setSubscription(null)
                setCourse(prev => prev ? {
                    ...prev,
                    subscribers_count: (prev.subscribers_count || 0) - 1
                } : null)
                setNotification({
                    type: 'success',
                    message: 'Вы успешно отписались от курса'
                })
            } else {
                const response = await courseRepository().subscribeToCourse(Number(id))
                setSubscription({
                    course_id: response.course_id,
                    user_id: response.user_id,
                    created_at: new Date().toISOString()
                })
                setCourse(prev => prev ? {
                    ...prev,
                    subscribers_count: (prev.subscribers_count || 0) + 1
                } : null)
                setNotification({
                    type: 'success',
                    message: 'Вы успешно подписались на курс'
                })
            }
        } catch (err) {
            console.error('Ошибка при подписке/отписке:', err)
            setNotification({
                type: 'error',
                message: 'Произошла ошибка при попытке подписки/отписки от курса'
            })
        } finally {
            setIsSubscribing(false)
            // Скрываем уведомление через 3 секунды
            setTimeout(() => {
                setNotification(null)
            }, 3000)
        }
    }

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center">Загрузка курса...</div>
                </div>
            </>
        )
    }

    if (error || !course) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center text-red-500">{error || 'Курс не найден'}</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
                        notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                        {notification.message}
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="flex gap-2 items-center text-sm text-gray-500 mb-4">
                    <MoveLeft className="w-4 h-4" />
                    <Link to="/">Вернуться на главную</Link>
                </div>

                <div className="">
                    <div className="">
                        {/* Course Title */}
                        <div className="flex items-center justify-between md:flex-row flex-col md:mb-0 mb-4">
                            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                            {currentUser?.nickname !== course.author_name && (
                                <button 
                                    onClick={handleSubscribe}
                                    disabled={isSubscribing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer md:w-auto w-full disabled:opacity-50"
                                >
                                    {isSubscribing ? "Загрузка..." : subscription ? "Отписаться" : "Подписаться"}
                                </button>
                            )}
                        </div>

                        {/* Course Meta */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex items-center">
                                <span className="font-semibold">{course.author_name}</span>
                            </div>

                            <div className="flex items-center">
                                <span>{course.subscribers_count} {course.subscribers_count === 1 ? "подписчик" : "подписчиков"}</span>
                            </div>

                            <div className="flex items-center">
                                {course.rating && course.rating > 0 ? (
                                    <>
                                        <StarRating rating={course.rating} totalStars={5} />
                                        <span className="ml-2 text-sm text-gray-500">
                                            {course.rating}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500">Нет оценок</span>
                                )}
                            </div>
                        </div>

                        {/* Course Description */}
                        <div className="mb-8">
                            <p className="text-gray-700">
                                {course.description}
                            </p>
                        </div>

                        {/* Course Content */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Содержание курса</h2>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-gray-600">
                                    {sections?.length || 0} {sections?.length === 1 ? "раздел" : "разделов"} &nbsp;•&nbsp; 
                                    {materials?.length || 0} {materials?.length === 1 ? "лекция" : "лекций"} &nbsp;•&nbsp; 
                                    {tasks?.length || 0} {tasks?.length === 1 ? "домашнее задание" : "домашних заданий"}
                                </div>
                                {currentUser?.nickname === course.author_name && (
                                    <Link to={`/course/edit/${course?.id}`} className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-200">Редактировать курс</Link>
                                )}
                            </div>

                            <Accordion type="single" collapsible className="border border-gray-200 rounded-md">
                                {sections?.map((section, index) => {
                                    const sectionMaterials = materials?.filter(m => m.section_id === section.id)
                                        .sort((a, b) => a.order_number - b.order_number) || []
                                    const sectionTasks = tasks?.filter(t => t.section_id === section.id)
                                        .sort((a, b) => a.order_number - b.order_number) || []
                                    
                                    const sortedLectures = [
                                        ...sectionMaterials.map(material => ({
                                            id: material.id,
                                            title: material.title,
                                            type: "material" as const,
                                            content_url: material.content_url,
                                            description: material.description,
                                            order_number: material.order_number
                                        })),
                                        ...sectionTasks.map(task => ({
                                            id: task.id,
                                            title: task.title,
                                            type: "task" as const,
                                            content_url: task.content_url,
                                            description: task.description,
                                            order_number: task.order_number
                                        }))
                                    ].sort((a, b) => a.order_number - b.order_number);
                                    
                                    return (
                                        <CourseSection 
                                            key={section.id} 
                                            index={index} 
                                            title={section.title}
                                            onExpand={() => {}}
                                            lectures={sortedLectures}
                                            isAuthor={currentUser?.nickname === course.author_name}
                                        />
                                    )
                                })}
                            </Accordion>
                        </div>

                        <CommentsSection 
                            authorName={course.author_name} 
                            courseId={course.id} 
                            onRatingUpdate={(updatedCourse: ICourse) => {
                                setCourse(updatedCourse)
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

interface CourseSectionProps {
    index: number
    title: string
    onExpand: () => void
    lectures?: {
        title: string
        type: "material" | "task"
        content_url?: string
        description: string
        id: number
    }[]
    isAuthor: boolean
}

function CourseSection({ index, title, onExpand, lectures = [], isAuthor }: CourseSectionProps) {
    const [answers, setAnswers] = useState<Record<number, IUserAnswer>>({})
    const [reviews, setReviews] = useState<Record<number, ITaskReview>>({})
    const [isUploading, setIsUploading] = useState<Record<number, boolean>>({})
    const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({})
    const [showPreview, setShowPreview] = useState<Record<number, boolean>>({})

    // Получаем courseId из URL
    const courseId = parseInt(window.location.pathname.split('/')[2], 10);

    const handleFileUpload = async (taskId: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(prev => ({ ...prev, [taskId]: true }))
            const formData = new FormData()
            formData.append('file', file)

            const response = await courseRepository().submitAnswer(courseId, taskId, { file })
            
            if (response.url) {
                // Update the answers state with the new answer
                const newAnswer: IUserAnswer = {
                    id: response.id || 0,
                    task_id: taskId,
                    user_id: 0, // This will be set by the backend
                    content_url: response.url,
                    created_at: new Date().toISOString()
                }
                setAnswers(prev => ({ ...prev, [taskId]: newAnswer }))
                
                // Сохраняем taskId в localStorage для использования при удалении
                localStorage.setItem(`answer_${response.id}_task_id`, taskId.toString())
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            // You might want to show an error message to the user here
        } finally {
            setIsUploading(prev => ({ ...prev, [taskId]: false }))
        }
    }

    const handleDeleteAnswer = async (taskId: number) => {
        const answer = answers[taskId]
        if (!answer) return

        try {
            setIsDeleting(prev => ({ ...prev, [taskId]: true }))

            // Сначала удаляем отзыв, если он есть
            const review = reviews[taskId]
            if (review) {
                await courseRepository().deleteReview(answer.id, review.id)
            }

            // Затем удаляем ответ
            await courseRepository().deleteAnswer(courseId, taskId, answer.id)
            
            // Remove answer and review from state
            setAnswers(prev => {
                const newAnswers = { ...prev }
                delete newAnswers[taskId]
                return newAnswers
            })
            setReviews(prev => {
                const newReviews = { ...prev }
                delete newReviews[taskId]
                return newReviews
            })
        } catch (error) {
            console.error('Error deleting answer:', error)
        } finally {
            setIsDeleting(prev => ({ ...prev, [taskId]: false }))
        }
    }

    useEffect(() => {
        // Fetch existing answers and reviews for tasks
        const fetchAnswersAndReviews = async () => {
            const taskIds = lectures
                .filter(lecture => lecture.type === "task")
                .map(lecture => lecture.id)

            for (const taskId of taskIds) {
                try {
                    const answer = await courseRepository().getAnswerForTask(taskId)
                    if (answer) {
                        setAnswers(prev => ({ ...prev, [taskId]: answer }))
                        
                        // If there's an answer, fetch its review
                        const review = await courseRepository().getReviewForAnswer(answer.id)
                        if (review) {
                            setReviews(prev => ({ ...prev, [taskId]: review }))
                        }
                    }
                } catch (error) {
                    console.error('Error fetching answer/review:', error)
                }
            }
        }

        fetchAnswersAndReviews()
    }, [lectures])

    return (
        <AccordionItem value={`section-${index}`}>
            <AccordionTrigger onClick={onExpand} className="hover:no-underline">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                        Раздел {index + 1}
                    </span>
                    <h3 className="text-base font-semibold">
                        {title}
                    </h3>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pl-4">
                    {lectures.map((lecture, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium mb-2">{lecture.title}</h4>
                                    <p className="text-sm text-gray-600">{lecture.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    {lecture.content_url && (
                                        <a
                                            href={lecture.content_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            {lecture.type === "material" ? "Открыть материал" : "Открыть задание"}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <AccordionContent className="px-4 py-3 flex gap-4 sm:flex-row flex-col text-wrap">
                                {(lecture.type === "material" || lecture.type === "task") && lecture.content_url ? (
                                    <div className="aspect-video max-h-[200px] min-w-[300px] rounded-md overflow-hidden bg-gray-100">
                                        {(() => {
                                            return null;
                                        })()}
                                        {lecture.content_url.toLowerCase().endsWith('.mp4') || 
                                         lecture.content_url.toLowerCase().endsWith('.webm') || 
                                         lecture.content_url.toLowerCase().endsWith('.mov') ? (
                                            <video
                                                src={lecture.content_url}
                                                controls
                                                preload="metadata"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error('Ошибка загрузки видео:', e);
                                                }}
                                            />
                                        ) : lecture.content_url.toLowerCase().endsWith('.jpg') || 
                                            lecture.content_url.toLowerCase().endsWith('.png') || 
                                            lecture.content_url.toLowerCase().endsWith('.jpeg') ? (
                                            <img
                                                src={lecture.content_url}
                                                alt={lecture.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => console.error('Ошибка загрузки изображения:', e)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <p className="text-gray-500">Неподдерживаемый формат файла: {lecture.content_url.split('.').pop()}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[15px] text-gray-800 font-bold">
                                            {lecture.type === "material" ? "Содержание материала" : "Задание"}
                                        </p>
                                    </div>
                                    <p className="text-[14px] text-gray-600">
                                        {lecture.description}
                                    </p>
                                    {lecture.type === "task" && (
                                        <div className="flex-1 flex items-end mt-4">
                                            {isAuthor ? (
                                                <Link 
                                                    to={`/review-answers/${lecture.id}`}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer w-fit"
                                                >
                                                    Просмотреть ответы
                                                </Link>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(lecture.id, e)}
                                                            disabled={isUploading[lecture.id]}
                                                            className="hidden"
                                                            id={`file-upload-${lecture.id}`}
                                                        />
                                                        <label
                                                            htmlFor={`file-upload-${lecture.id}`}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer"
                                                        >
                                                            {isUploading[lecture.id] 
                                                                ? "Загрузка..." 
                                                                : "Прикрепить файл"
                                                            }
                                                        </label>
                                                        {answers[lecture.id] && (
                                                            <div className="flex items-center gap-4">
                                                                <button
                                                                    onClick={() => setShowPreview(prev => ({ ...prev, [lecture.id]: !prev[lecture.id] }))}
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                >
                                                                    {showPreview[lecture.id] ? "Скрыть ответ" : "Просмотреть ответ"}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAnswer(lecture.id)}
                                                                    disabled={isDeleting[lecture.id]}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    {isDeleting[lecture.id] ? "Удаление..." : "Удалить ответ"}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {answers[lecture.id] && showPreview[lecture.id] && (
                                                        <div className="mt-4 w-full">
                                                            <div className="aspect-video max-h-[200px] rounded-md overflow-hidden bg-gray-100">
                                                                {answers[lecture.id].content_url.toLowerCase().endsWith('.mp4') || 
                                                                 answers[lecture.id].content_url.toLowerCase().endsWith('.webm') || 
                                                                 answers[lecture.id].content_url.toLowerCase().endsWith('.mov') ? (
                                                                    <video
                                                                        src={answers[lecture.id].content_url}
                                                                        controls
                                                                        preload="metadata"
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            console.error('Ошибка загрузки видео:', e);
                                                                        }}
                                                                    />
                                                                ) : answers[lecture.id].content_url.toLowerCase().endsWith('.jpg') || 
                                                                    answers[lecture.id].content_url.toLowerCase().endsWith('.png') || 
                                                                    answers[lecture.id].content_url.toLowerCase().endsWith('.jpeg') ? (
                                                                    <img
                                                                        src={answers[lecture.id].content_url}
                                                                        alt="Ответ на задание"
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => console.error('Ошибка загрузки изображения:', e)}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <a 
                                                                            href={answers[lecture.id].content_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            Открыть файл
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {reviews[lecture.id] && (
                                                                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Отзыв преподавателя:</h4>
                                                                    <p className="text-sm text-gray-600">{reviews[lecture.id].author_comment}</p>
                                                                    <p className="text-sm text-gray-600 mt-1">Оценка: {reviews[lecture.id].grade}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}