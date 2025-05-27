import { useEffect, useState } from "react"
import { MoveLeft } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "shared/ui/accordion"
import { StarRating } from "shared/ui/rating"
import { CommentsSection } from "entities/comment"
import { Link, useParams } from "react-router-dom"
import { Header } from "widgets/header"
import { courseRepository } from "entities/course/api"
import type { ICourse, ISection, ICourseMaterial, ICourseTask } from "entities/course/model/types"



export const Course = () => {
    const { id } = useParams<{ id: string }>()
    const [course, setCourse] = useState<ICourse | null>(null)
    const [sections, setSections] = useState<ISection[]>([])
    const [materials, setMaterials] = useState<ICourseMaterial[]>([])
    const [tasks, setTasks] = useState<ICourseTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                setSections(sectionsData)

                // Получаем материалы и задания для каждой секции
                const materialsData = await courseRepository().getMaterials(Number(id))
                const tasksData = await courseRepository().getTasks(Number(id))

                // Объединяем все материалы и задания
                setMaterials(materialsData)
                setTasks(tasksData)

            } catch (err) {
                console.error('Ошибка при загрузке данных курса:', err)
                setError('Не удалось загрузить информацию о курсе')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseData()
    }, [id])

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
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer md:w-auto w-full">
                                Подписаться
                            </button>
                        </div>

                        {/* Course Meta */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex items-center">
                                <span className="font-semibold">{course.author_name}</span>
                            </div>

                            {/* <div className="flex items-center">
                                <span>{formatNumber(course.subscribers_count || 0)} подписчиков</span>
                            </div> */}

                            <div className="flex items-center">
                                <StarRating rating={course.rating} totalStars={5} />
                                {/* <span className="ml-2">
                                    {course.rating} ({formatNumber(course.ratings_count || 0)} оценок)
                                </span> */}
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
                                <Link to={`/course/edit/${course?.id}`} className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-200">Редактировать курс</Link>
                            </div>

                            <Accordion type="single" collapsible className="border border-gray-200 rounded-md">
                                {sections?.map((section, index) => {
                                    const sectionMaterials = materials?.filter(m => m.section_id === section.id) || []
                                    const sectionTasks = tasks?.filter(t => t.section_id === section.id) || []
                                    
                                    return (
                                        <CourseSection 
                                            key={section.id} 
                                            index={index} 
                                            title={section.title}
                                            onExpand={() => {}}
                                            lectures={[
                                                ...sectionMaterials.map(material => ({
                                                    title: material.description,
                                                    duration: "0:00",
                                                    isCompleted: false,
                                                    type: "video" as const
                                                })),
                                                ...sectionTasks.map(task => ({
                                                    title: task.description,
                                                    duration: "0:00",
                                                    isCompleted: false,
                                                    type: "document" as const
                                                }))
                                            ]}
                                        />
                                    )
                                })}
                            </Accordion>
                        </div>

                        <CommentsSection />
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
        duration: string
        isCompleted: boolean
        type: "video" | "document"
    }[]
}

function CourseSection({ index, title, onExpand, lectures = [] }: CourseSectionProps) {
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
                                    {block.type === "video" ? <span className="text-[12px] border border-blue-200 text-blue-500 p-1 rounded-md mr-2">Лекция</span> : <span className="text-[12px] border border-teal-200 text-teal-500 p-1 rounded-md mr-2">Задание</span>}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 py-3 flex gap-4 sm:flex-row flex-col text-wrap">
                                <div className="aspect-video max-h-[200px] min-w-[300px] rounded-md overflow-hidden">
                                    <iframe
                                        src="https://rutube.ru/play/embed/b1ba4b053467a40524375b2c1a236985"
                                        allow="clipboard-write; autoplay"
                                        allowFullScreen
                                        className="w-full h-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[15px] text-gray-800 font-bold">
                                            {block.type === "video" ? "Содержание лекции" : "Задание"}
                                        </p>
                                    </div>
                                    <p className="text-[14px] text-gray-600">
                                        {block.title}
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </AccordionContent>
        </AccordionItem>
    )
}