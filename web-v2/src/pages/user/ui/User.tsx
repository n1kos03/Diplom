import { useState } from "react";
import { Tabs } from "shared/ui/tabs/Tabs"
import { Card, CardContent } from "shared/ui/card"
import { StarRating } from "shared/ui/rating/StarRating"
import { Link } from "react-router-dom";
import { Modal } from "shared/ui/modal"
import { Input } from "shared/ui/input"

const user = {
    name: "Nikita",
    verified: true,
    company: "Htmlstream",
    location: "San Francisco, US",
    joined: "March 2017",
    avatar: "https://ui-avatars.com/api/?name=Ella+Lauda&background=cccccc&color=222222&size=256",
}

// Примерная имитация авторизации
const isLoggedIn = true;
const userMini = {
    name: "Никита",
    avatar: "https://ui-avatars.com/api/?name=Ella+Lauda&background=cccccc&color=222222&size=64",
}

// Примерные фото
const photos = [
    "https://21-school.ru/_next/image?url=https%3A%2F%2Fback.21-school.ru%2Fstorage%2Fimages%2FMd8sEkMbWksObje0Pl97BmGri7SFQHgigxUF8c75.jpg&w=1920&q=75",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=400&q=80",
    "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
]

// Примерные курсы
const courses = [
    {
        id: 1,
        title: "Полный продвинутый 6-недельный буткемп по UI/UX дизайну",
        author: "Доктор Марли Батор",
        description:
            "Наш 6-недельный буткемп по UI/UX дает студентам необходимые навыки для успешной карьеры дизайнера. Учитесь на практике с экспертами индустрии.",
        category: "РАЗРАБОТКА",
        rating: 4.9,
        students: 1936922,
        price: 549.0,
        createdAt: "2025-01-15",
    },
    {
        id: 2,
        title: "SQL для новичков 2025: Интенсивный курс выходного дня",
        author: "Эмма Родригес",
        description:
            "Освойте основы SQL за выходные. Идеально подходит для начинающих, которые хотят быстро изучить навыки работы с базами данных для своих проектов или карьеры.",
        category: "РАЗРАБОТКА",
        rating: 4.5,
        students: 435671,
        price: 13.0,
        createdAt: "2025-02-20",
    },
]

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
                <button className="hidden sm:inline-flex items-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition mr-2">
                    Создать курс
                </button>
                {isLoggedIn ? (
                    <Avatar alt={userMini.name} size={36} />
                ) : (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow">Login</button>
                )}
            </div>
        </header>
    )
}

function CourseCard({ course }: { course: typeof courses[0] }) {
    const formattedDate = new Date(course.createdAt).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
    const formattedPrice = new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 2,
    }).format(course.price)
    return (
        <Card className="border-gray-200 overflow-hidden flex flex-col h-full">
            <CardContent className="pt-6 flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <StarRating rating={course.rating} totalStars={5} />
                        <span className="ml-1 text-sm">{course.rating}</span>
                    </div>
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                <div className="text-sm text-gray-500 mb-2">
                    <span>Автор: {course.author}</span>
                </div>
                <div className="text-xs text-gray-400">
                    <span>Создано: {formattedDate}</span>
                </div>
            </CardContent>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center px-6 pb-4">
                <div className="flex items-center text-sm text-gray-500">
                    <span>{course.students.toLocaleString()} {course.students > 1 ? "студентов" : "студента"}</span>
                </div>
            </div>
        </Card>
    )
}

function PhotoGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
            {photos.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img src={src} alt="Фото" className="object-cover w-full h-full" />
                </div>
            ))}
        </div>
    )
}

export const User = () => {
    const [activeTab, setActiveTab] = useState("photo")
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editedName, setEditedName] = useState(user.name)

    const handleSaveName = () => {
        // Здесь будет логика сохранения имени
        user.name = editedName
        setIsEditModalOpen(false)
    }

    const tabs = [
        {
            id: "photo",
            label: "Фотографии",
            content: <PhotoGrid />,
        },
        {
            id: "courses",
            label: "Курсы",
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            ),
        },
    ]

    const avatarSize = 128;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 flex flex-col bg-blue-600">
                {/* Banner */}
                <div className="h-40 w-full flex justify-center">
                    <div className="w-full sm:h-48 overflow-hidden relative" />
                </div>
                {/* Белый блок с аватаром и контентом */}
                <div className="flex-1 w-full relative flex flex-col min-h-0">
                    {/* Аватар overlay */}
                    <div
                        className="absolute left-1/2 -translate-y-[50px] sm:-translate-y-1/2 -translate-x-1/2 z-10"
                        style={{ top: `-${avatarSize / 2}px` }}
                    >
                        <Avatar alt={user.name} size={avatarSize} />
                    </div>
                    <div className="bg-white rounded-t-3xl pt-16 sm:pt-20 pb-8 px-4 sm:px-8 mt-[-48px] sm:mt-[-64px] flex flex-col items-center relative z-0 w-full flex-1 min-h-0">
                        <div className="relative w-full">
                            <Link to="/" className="absolute -top-42 sm:-top-15 sm:left-0 inline-flex items-center text-white sm:text-gray-800 font-bold text-base">
                                ← Вернуться на главную
                            </Link>
                        </div>
                        <div className="relative w-full">
                            <div className="flex flex-col items-center mb-4">
                                <h1 className="mb-6 text-2xl sm:text-3xl font-bold">{user.name}</h1>
                                <div className="w-full flex flex-col items-center justify-center sm:flex-row gap-2">
                                    <button
                                        className="
                                        mt-2 px-5 py-2 rounded-lg border border-blue-600 text-blue-600 font-semibold
                                        hover:bg-blue-50 transition
                                        max-w-full whitespace-nowrap w-full sm:w-auto
                                    "
                                    >
                                        Добавить фото
                                    </button>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="
                                        mt-2 px-5 py-2 rounded-lg border border-gray-300 text-gray-600 font-semibold
                                        hover:bg-gray-50 transition
                                        max-w-full whitespace-nowrap w-full sm:w-auto
                                    "
                                    >
                                        Изменить профиль
                                    </button>
                                </div>
                            </div>
                        </div>
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                        <div className="w-full border-b border-gray-200 mb-2" />
                        <div className="w-full flex-1 min-h-0">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Изменить имя"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Имя
                        </label>
                        <Input
                            id="name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Введите новое имя"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSaveName}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default User
