import { useEffect, useState } from "react"
import { MoveLeft } from "lucide-react"

// import { Button } from "shared/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "shared/ui/accordion"
// import { Heart } from "lucide-react"
import { StarRating } from "shared/ui/rating"
import { CommentsSection } from "entities/comment"
import { Link } from "react-router-dom"

type Lecture = {
    title: string
    duration: string
    isCompleted: boolean
    type: "video" | "document"
}

type CourseSection = {
    title: string
    index: number
    lectures: Lecture[]
}

const COURSE_SECTIONS: CourseSection[] = [
    {
        title: "Beginner - Introduction to UX designing",
        index: 0,
        lectures: [
            { title: "Read before you start", duration: "02:53", isCompleted: true, type: "document" },
            {
                title: "Introduction to Figma essentials training course",
                duration: "02:45",
                isCompleted: true,
                type: "video",
            },
            {
                title: "What is the difference between UI & UX in Figma",
                duration: "05:22",
                isCompleted: true,
                type: "video",
            },
            {
                title: "What we are making in this Figma course",
                duration: "09:18",
                isCompleted: false,
                type: "video",
            },
            {
                title: "Class project 02- Create your own brief",
                duration: "1 Question",
                isCompleted: false,
                type: "document",
            },
            {
                title: "Class project 02- Create your own brief",
                duration: "1 Question",
                isCompleted: false,
                type: "document",
            },
        ]

    },
    {
        title: "Beginner - Introduction to UX designing",
        index: 1,
        lectures: [
            { title: "Read before you start", duration: "02:53", isCompleted: true, type: "document" },
            {
                title: "Introduction to Figma essentials training course",
                duration: "02:45",
                isCompleted: true,
                type: "video",
            },
        ]
    },
    {
        title: "Beginner - Introduction to UX designing",
        index: 2,
        lectures: [
            { title: "Read before you start", duration: "02:53", isCompleted: true, type: "document" },
            {
                title: "Introduction to Figma essentials training course",
                duration: "02:45",
                isCompleted: true,
                type: "video",
            },
        ]
    }
]

const isLoggedIn = true;
const userMini = {
    name: "Никита",
    avatar: "https://ui-avatars.com/api/?name=Ella+Lauda&background=cccccc&color=222222&size=64",
}

function Avatar({ alt, size = 32 }: { alt: string; size?: number }) {
    const px = `${size}px`;
    return (
        <div
            className="rounded-full border-4 border-white overflow-hidden bg-gray-200 flex items-center justify-center font-bold select-none"
            style={{ width: px, height: px, fontSize: size / 2 }}
        >
            {alt?.[0]?.toUpperCase() || "?"}
        </div>
    )
}

function Header() {
    return (
        <header className="w-full flex items-center justify-between px-4 sm:px-8 py-4 bg-white/80 backdrop-blur border-b border-gray-100 z-50 h-16">
            <div className="font-bold text-xl text-blue-700 tracking-tight">nikitosik</div>
            <div className="flex items-center gap-2">
                <Link to="/course/add" className="hidden sm:inline-flex items-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition mr-2">
                    Создать курс
                </Link>
                {isLoggedIn ? (
                    <Avatar alt={userMini.name} size={36} />
                ) : (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow">Login</button>
                )}
            </div>
        </header>
    )
}

export const Course = () => {
    const [averageRating, setAverageRating] = useState<number | null>(null)

    const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

    useEffect(() => {
        setAverageRating(4.6);
    }, []);

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
                            <h1 className="text-3xl font-bold mb-4">Новый курс Никиты Kimbratr по фронтенду</h1>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer md:w-auto w-full">
                                Подписаться
                            </button>
                        </div>

                        {/* Course Meta */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex items-center">
                                <span className="font-semibold">Никита Kimbratr</span>
                            </div>

                            <div className="flex items-center">
                                <span>{formatNumber(12)} подписчиков</span>
                            </div>

                            {averageRating && (
                                <div className="flex items-center">
                                    <StarRating rating={averageRating} totalStars={5} />
                                    <span className="ml-2">
                                        {averageRating} ({formatNumber(8)} оценок)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Course Description */}
                        <div className="mb-8">
                            <p className="text-gray-700">
                                Это практикоориентированный курс, где вы шаг за шагом освоите HTML, CSS и JavaScript, научитесь строить адаптивные и отзывчивые интерфейсы, разберётесь с компонентным подходом и современными фреймворками, такими как React. Вместе мы превратим сухой код в живые приложения, научим вас мыслить как разработчик и подготовим к реальной работе в команде.
                            </p>
                        </div>

                        {/* Course Content */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Содержание курса</h2>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-gray-600">{COURSE_SECTIONS.length} {COURSE_SECTIONS.length > 1 ? "разделов" : "раздел"} • {COURSE_SECTIONS.reduce((acc, section) => acc + section.lectures.filter(lecture => lecture.type === "video").length, 0)} {COURSE_SECTIONS.reduce((acc, section) => acc + section.lectures.filter(lecture => lecture.type === "video").length, 0) > 1 ? "лекций" : "лекция"} • {COURSE_SECTIONS.reduce((acc, section) => acc + section.lectures.filter(lecture => lecture.type === "document").length, 0)} {COURSE_SECTIONS.reduce((acc, section) => acc + section.lectures.filter(lecture => lecture.type === "document").length, 0) > 1 ? "домашних заданий" : "домашнее задание"}</div>
                                <Link to="/course/edit" className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-200">Редактировать курс</Link>
                            </div>

                            <Accordion type="single" collapsible onValueChange={(value) => {
                                if (!value) {
                                    setExpandedBlock(null);
                                }
                            }} className="border border-gray-200 rounded-md">
                                {COURSE_SECTIONS.map((section) => (
                                    <CourseSection key={section.index} isExpanded={expandedBlock === section.index} onExpand={() => setExpandedBlock(section.index)} {...section} />
                                ))}
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
                        <AccordionItem value={`lecture-${index}`} className="last:border-b-0">
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
                                        {/* {block.type === "document" && <button className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-200">Прикрепить файл</button>} */}
                                    </div>
                                    <p className="text-[14px] text-gray-600">
                                        Мы разберём ключевые приёмы, поделимся полезными лайфхаками и покажем, как превратить идеи в работающий продукт. Подходит как новичкам, так и тем, кто хочет освежить свои знания.
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

function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num)
}