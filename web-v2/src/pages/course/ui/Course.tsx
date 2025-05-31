import { useEffect, useState } from "react"
import { MoveLeft } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "shared/ui/accordion"
import { StarRating } from "shared/ui/rating"
import { CommentsSection } from "entities/comment"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Header } from "widgets/header"
import { courseRepository } from "entities/course/api"
import { ratingRepository } from "entities/rating/api"
import type { ICourse, ISection, ICourseMaterial, ICourseTask } from "entities/course/model/types"
import type { ISubscription } from "entities/course/model/types"
import type { IUserAnswer, ITaskReview } from "entities/course/model/types"
import type { IUser } from "entities/user/model/types"

export const Course = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [course, setCourse] = useState<ICourse | null>(null)
    const [sections, setSections] = useState<ISection[]>([])
    const [materials, setMaterials] = useState<ICourseMaterial[]>([])
    const [tasks, setTasks] = useState<ICourseTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<IUser | null>(null)
    const [subscription, setSubscription] = useState<ISubscription | null>(null)
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [userAnswers, setUserAnswers] = useState<Record<number, IUserAnswer[]>>({})
    const [reviews, setReviews] = useState<Record<number, ITaskReview>>({})

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const userData = JSON.parse(userStr)
                setCurrentUser(userData.user as IUser)
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
                const [courseData, sectionsData, materialsData, tasksData] = await Promise.all([
                    courseRepository().getCourseById(Number(id)),
                    courseRepository().getSections(Number(id)),
                    courseRepository().getMaterials(Number(id)),
                    courseRepository().getTasks(Number(id))
                ])

                setCourse(courseData)
                setSections(sectionsData)
                setMaterials(materialsData)
                setTasks(tasksData)

                // Загружаем ответы пользователя для всех заданий только если пользователь не автор
                if (currentUser && currentUser.id !== courseData.author_id && tasksData) {
                    const answersPromises = tasksData.map(task =>
                        courseRepository().getAnswers(Number(id), task.id)
                    )
                    const answersResults = await Promise.all(answersPromises)

                    const answersMap: Record<number, IUserAnswer[]> = {}
                    tasksData.forEach((task, index) => {
                        // Фильтруем ответы только текущего пользователя
                        answersMap[task.id] = (answersResults[index] || [])
                            .filter(answer => answer.user_id === currentUser.id)
                    })
                    setUserAnswers(answersMap)

                    // Загружаем ревью для ответов пользователя
                    const reviewsPromises = answersResults.flatMap(answers => 
                        (answers || [])
                            .filter(answer => answer.user_id === currentUser.id)
                            .map(answer => courseRepository().getReview(answer.id))
                    )
                    const reviewsResults = await Promise.all(reviewsPromises)
                    
                    const reviewsMap: Record<number, ITaskReview> = {}
                    reviewsResults.forEach(review => {
                        if (review) {
                            reviewsMap[review.answer_id] = review
                        }
                    })
                    setReviews(reviewsMap)
                }

                // Получаем рейтинг курса
                try {
                    await ratingRepository().getAllRatings()
                } catch (err) {
                    console.error('Ошибка при загрузке рейтинга:', err)
                }

                // Получаем подписку
                try {
                    const subscriptions = await courseRepository().getSubscriptions()
                    if (currentUser && subscriptions) {
                        const courseSubscription = subscriptions.find(s =>
                            s.course_id === Number(id) &&
                            s.user_id === currentUser.id
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
    }, [id, currentUser])

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

    const handleFileUpload = async (taskId: number, file: File) => {
        if (!id || !file) return

        try {
            const formData = new FormData()
            formData.append('file', file)

            await courseRepository().uploadAnswer(Number(id), taskId, { file })

            // Обновляем список ответов после загрузки
            const updatedAnswers = await courseRepository().getAnswers(Number(id), taskId)
            setUserAnswers(prev => {
                const newAnswers = { ...prev }
                newAnswers[taskId] = updatedAnswers
                return newAnswers
            })
        } catch (err) {
            console.error('Error uploading answer:', err)
        }
    }

    const handleViewAnswers = (taskId: number) => {
        navigate(`/course/${id}/task/${taskId}/answers`)
    }

    const handleDeleteAnswer = async (taskId: number, answerId: number) => {
        if (!id) return

        try {
            await courseRepository().deleteAnswer(Number(id), taskId, answerId)

            // Обновляем список ответов после удаления
            const updatedAnswers = await courseRepository().getAnswers(Number(id), taskId)
            setUserAnswers(prev => {
                const newAnswers = { ...prev }
                newAnswers[taskId] = updatedAnswers
                return newAnswers
            })

            // Удаляем ревью для удаленного ответа
            setReviews(prev => {
                const newReviews = { ...prev }
                delete newReviews[answerId]
                return newReviews
            })

            setNotification({
                type: 'success',
                message: 'Ответ успешно удален'
            })
        } catch (err) {
            console.error('Error deleting answer:', err)
            setNotification({
                type: 'error',
                message: 'Не удалось удалить ответ'
            })
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
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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

                                    // Объединяем материалы и задачи в один массив, сохраняя их порядок
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
                                            onExpand={() => { }}
                                            lectures={sortedLectures}
                                            currentUser={currentUser}
                                            course={course}
                                            userAnswers={userAnswers}
                                            onFileUpload={handleFileUpload}
                                            onViewAnswers={handleViewAnswers}
                                            onDeleteAnswer={handleDeleteAnswer}
                                            reviews={reviews}
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
        id: number
        title: string
        type: "material" | "task"
        content_url?: string
        description: string
    }[]
    currentUser: IUser | null
    course: ICourse | null
    userAnswers: Record<number, IUserAnswer[]>
    onFileUpload: (taskId: number, file: File) => Promise<void>
    onViewAnswers: (taskId: number) => void
    onDeleteAnswer: (taskId: number, answerId: number) => Promise<void>
    reviews: Record<number, ITaskReview>
}

function CourseSection({
    index,
    title,
    onExpand,
    lectures = [],
    currentUser,
    course,
    userAnswers,
    onFileUpload,
    onViewAnswers,
    onDeleteAnswer,
    reviews,
}: CourseSectionProps) {
    const handleFileChange = (taskId: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            onFileUpload(taskId, file)
        }
    }

    return (
        <AccordionItem value={`${index}-${title}`} className="last:border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline cursor-pointer" onClick={onExpand}>
                <div className="flex items-center gap-4 w-full">
                    <div className="text-left">
                        <span className="font-bold">
                            {title}
                        </span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-0">
                <Accordion type="single" collapsible>
                    {lectures.map((block, index) => (
                        <AccordionItem key={index} value={`lecture-${index}`} className="last:border-b-0">
                            <AccordionTrigger className="px-4 py-3 font-medium hover:no-underline cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <span>{block.title}</span>
                                    {block.type === "material" ?
                                        <span className="text-[12px] border border-blue-200 text-blue-500 p-1 rounded-md mr-2">Материал</span> :
                                        <span className="text-[12px] border border-teal-200 text-teal-500 p-1 rounded-md mr-2">Задание</span>
                                    }
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 py-3 flex gap-4 flex-col text-wrap w-full">
                                <div className="flex gap-4">
                                    {(block.type === "material" || block.type === "task") && block.content_url ? (
                                        <div className="aspect-video max-h-[200px] min-w-[300px] rounded-md overflow-hidden bg-gray-100">
                                            {(() => {
                                                return null;
                                            })()}
                                            {block.content_url.toLowerCase().endsWith('.mp4') ||
                                                block.content_url.toLowerCase().endsWith('.webm') ||
                                                block.content_url.toLowerCase().endsWith('.mov') ? (
                                                <video
                                                    src={block.content_url}
                                                    controls
                                                    preload="metadata"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Ошибка загрузки видео:', e);
                                                    }}
                                                />
                                            ) : block.content_url.toLowerCase().endsWith('.jpg') ||
                                                block.content_url.toLowerCase().endsWith('.png') ||
                                                block.content_url.toLowerCase().endsWith('.jpeg') ? (
                                                <img
                                                    src={block.content_url}
                                                    alt={block.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => console.error('Ошибка загрузки изображения:', e)}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <p className="text-gray-500">Неподдерживаемый формат файла: {block.content_url.split('.').pop()}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                    <div className="flex flex-col gap-1 h-full justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[15px] text-gray-800 font-bold">
                                                    {block.type === "material" ? "Содержание материала" : "Задание"}
                                                </p>
                                            </div>
                                            <p className="text-[14px] text-gray-600">
                                                {block.description}
                                            </p>
                                        </div>
                                        {block.type === "task" && (!userAnswers[block.id] || userAnswers[block.id].length === 0) && currentUser?.id !== course?.author_id && (
                                            <div className="mt-4 flex flex-col gap-2 w-full">
                                                <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer w-full md:w-fit text-center">
                                                    Прикрепить ответ
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleFileChange(block.id)}
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        {block.type === "task" && currentUser?.id === course?.author_id && (
                                            <button
                                                onClick={() => onViewAnswers(block.id)}
                                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer w-fit"
                                            >
                                                Посмотреть ответы
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {block.type === "task" && userAnswers[block.id]?.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-200 w-full my-2"></div>
                                        <div className="flex-1 flex items-end w-full">
                                            <div className="flex flex-col gap-4 w-full">
                                                <div className="flex flex-col gap-4 w-full">
                                                    <div className="p-4 rounded-lg border border-gray-200 w-full">
                                                        <div className="flex flex-col gap-4">
                                                            {/* Ответ пользователя */}
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-medium text-gray-700">Ваш ответ:</p>
                                                                    
                                                                    <button
                                                                        onClick={() => onDeleteAnswer(block.id, userAnswers[block.id][0].id)}
                                                                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                                        title="Удалить ответ"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                <a
                                                                    href={userAnswers[block.id][0].content_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-2"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Ответ
                                                                </a>
                                                            </div>

                                                            {/* Разделитель */}
                                                            <div className="h-px bg-gray-200"></div>

                                                            {/* Ответ автора */}
                                                            <div className="flex flex-col gap-2">
                                                                <p className="text-sm font-medium text-gray-700">Ответ автора:</p>
                                                                {reviews[userAnswers[block.id][0].id] ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <p className="text-gray-800">{reviews[userAnswers[block.id][0].id].author_comment}</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <StarRating rating={reviews[userAnswers[block.id][0].id].grade} totalStars={5} />
                                                                            <span className="text-sm text-gray-600">{reviews[userAnswers[block.id][0].id].grade}/5</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-gray-500 italic">Автор пока не ответил</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </AccordionContent>
        </AccordionItem>
    )
}