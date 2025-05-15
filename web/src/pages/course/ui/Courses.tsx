"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardFooter } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StarRating } from "shared/ui/rating"
import { Card, CardContent, CardFooter } from "shared/ui/card"
import { Input } from "shared/ui/input"
import { Link } from "react-router-dom"

// Меняющиеся слова слогана
const sloganWords = ["обучению", "курсам", "навыкам", "знаниям", "успеху"]

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
        {isLoggedIn ? (
          <Link to="/user" className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium">{userMini.name}</span>
            <Avatar alt={userMini.name} size={36} />
          </Link>
        ) : (
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow">Login</button>
        )}
      </div>
    </header>
  )
}

export const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsChanging(true)
      setTimeout(() => {
        setCurrentSloganIndex((prevIndex) => (prevIndex + 1) % sloganWords.length)
        setIsChanging(false)
      }, 500)
    }, 3000)

    return () => clearInterval(intervalId)
  }, [])

  // Sample course data
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
    {
      id: 3,
      title: "SEO 2021: Полное обучение SEO + SEO для сайтов на WordPress",
      author: "Михаил Чен",
      description:
        "Изучите современные техники SEO для повышения видимости вашего сайта. Включает практические стратегии оптимизации WordPress.",
      category: "РАЗРАБОТКА",
      rating: 4.5,
      students: 435671,
      price: 13.0,
      createdAt: "2025-03-05",
    },
    {
      id: 4,
      title: "Мастер-класс по графическому дизайну - Учимся создавать отличный дизайн",
      author: "Сара Джонсон",
      description:
        "Комплексный курс по дизайну, охватывающий типографику, теорию цвета, компоновку и цифровые инструменты для современных графических дизайнеров.",
      category: "ДИЗАЙН",
      rating: 3.5,
      students: 435671,
      price: 56.0,
      createdAt: "2025-01-30",
    },
    {
      id: 5,
      title: "[НОВЫЙ] Полный курс подготовки к сертификации AWS Cloud Practitioner - 2021",
      author: "Джеймс Уилсон",
      description:
        "Подготовьтесь к сертификации AWS с помощью этого комплексного курса. Включает практические экзамены и лабораторные работы.",
      category: "РАЗРАБОТКА",
      rating: 4.5,
      students: 435671,
      price: 13.0,
      createdAt: "2025-04-10",
    },
    {
      id: 6,
      title: "Полный курс Python 2021: От нуля до профессионала",
      author: "Алекс Ривера",
      description:
        "Начните с нуля и станьте экспертом Python. Учитесь на практике, создавая реальные проекты с использованием современных техник Python.",
      category: "РАЗРАБОТКА",
      rating: 4.5,
      students: 435671,
      price: 13.0,
      createdAt: "2025-02-15",
    },
  ]

  // Filter courses based on search query
  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Секция с меняющимся слоганом */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Найдите свой путь к{" "}
            <span
              className={`text-blue-600 inline-block min-w-32 transition-opacity duration-500 ${isChanging ? "opacity-0" : "opacity-100"}`}
            >
              {sloganWords[currentSloganIndex]}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Откройте для себя тысячи курсов от экспертов, которые помогут вам освоить новые навыки
          </p>
        </div>

        {/* Заголовок и элементы управления курсами */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-3xl font-bold mb-4 md:mb-0">Курсы</h2>
          <Link to="/course/add" className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Добавить курс
          </Link>
        </div>

        {/* Поиск и фильтры */}
        <div className="w-full mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Поиск по вашим курсам..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Сетка карточек курсов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link to={`/course/${course.id}`} key={course.id}>
              <CourseCard key={course.id} course={course} />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

interface CourseCardProps {
  course: {
    id: number
    title: string
    author: string
    description: string
    category: string
    rating: number
    students: number
    price: number
    createdAt: string
  }
}

function CourseCard({ course }: CourseCardProps) {
  // Форматирование даты
  const formattedDate = new Date(course.createdAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Форматирование цены
  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
  }).format(course.price)

  return (
    <Card className="border-gray-200 overflow-hidden flex flex-col h-full">
      <CardContent className="pt-6 flex-grow">
        <div className="flex items-center justify-between mb-2">
          {/* <span className="text-xs font-semibold text-blue-600">{course.category}</span> */}
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
      <CardFooter className="border-t border-gray-200 pt-4 flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500">
          <span>{formatNumber(course.students)} {course.students > 1 ? "студентов" : "студента"}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}
