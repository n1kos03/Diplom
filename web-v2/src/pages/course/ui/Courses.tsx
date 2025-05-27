"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { StarRating } from "shared/ui/rating"
import { Card, CardContent } from "shared/ui/card"
import { Input } from "shared/ui/input"
import { Link } from "react-router-dom"
import { Header } from "widgets/header"
import { courseRepository } from "entities/course/api"
import type { ICourse } from "entities/course/model/types"

// Меняющиеся слова слогана
const sloganWords = ["обучению", "курсам", "навыкам", "знаниям", "успеху"]

export const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0)
  const [isChanging, setIsChanging] = useState(false)
  const [courses, setCourses] = useState<ICourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true)
        const response = await courseRepository().getAllCourses()
        setCourses(response)
      } catch (err) {
        setError("Не удалось загрузить курсы")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])

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

  // Filter courses based on search query
  const filteredCourses = courses?.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || []

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center">Загрузка курсов...</div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </>
    )
  }

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

        {courses && courses.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Курсы не найдены</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска."
                : "Пока нет доступных курсов. Будьте первым, кто создаст курс!"}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

interface CourseCardProps {
  course: ICourse
}

function CourseCard({ course }: CourseCardProps) {
  // Форматирование даты
  const formattedDate = new Date(course.created_at).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Link to={`/course/${course.id}`} className="block h-full">
      <Card className="border-gray-200 overflow-hidden flex flex-col h-full transition hover:shadow-md">
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
            <span>Автор: {course.author_name}</span>
          </div>
          <div className="text-xs text-gray-400">
            <span>Создано: {formattedDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
