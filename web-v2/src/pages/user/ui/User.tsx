import { useState, useEffect, useRef } from "react";
import { Tabs } from "shared/ui/tabs/Tabs"
import { Card, CardContent } from "shared/ui/card"
import { StarRating } from "shared/ui/rating/StarRating"
import { Link, useParams } from "react-router-dom";
import { Modal } from "shared/ui/modal"
import { Input } from "shared/ui/input"
import { Header } from "widgets/header"
import { Avatar } from "shared/ui/avatar/Avatar"
import { userRepository } from "entities/user/api"
import { courseRepository } from "entities/course/api"
import type { IUser, IUpdateUserData, IUserPhoto } from "entities/user/model/types"
import type { ICourse } from "entities/course/model/types"

function CourseCard({ course }: { course: ICourse }) {
    const formattedDate = new Date(course.created_at).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
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
                    <span>Автор: {course.author_name}</span>
                </div>
                <div className="text-xs text-gray-400">
                    <span>Создано: {formattedDate}</span>
                </div>
            </CardContent>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center px-6 pb-4">
                <div className="flex items-center text-sm text-gray-500">
                    <span>{course.subscribers_count || 0} {course.subscribers_count === 1 ? "подписчик" : "подписчиков"}</span>
                </div>
            </div>
        </Card>
    )
}

function PhotoGrid({ photos }: { photos: IUserPhoto[] }) {
    if (!photos || photos.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Нет доступных фотографий
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
            {photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img src={photo.content_url} alt="Фото пользователя" className="object-cover w-full h-full" />
                </div>
            ))}
        </div>
    )
}

export const User = () => {
    const { id } = useParams<{ id: string }>()
    const [activeTab, setActiveTab] = useState("photo")
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [user, setUser] = useState<IUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [editedName, setEditedName] = useState("")
    const [userPhotos, setUserPhotos] = useState<IUserPhoto[]>([]);
    const [userCourses, setUserCourses] = useState<ICourse[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!id) return
                const userData = await userRepository().getUserById(Number(id))
                setUser(userData)
                setEditedName(userData.nickname)
                await fetchUserPhotos();
                await fetchUserCourses();
            } catch (error) {
                console.error('Ошибка при получении данных пользователя:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [id])

    const fetchUserPhotos = async () => {
        try {
            if (!id) return;
            const photos = await userRepository().getUserPhotos(Number(id));
            setUserPhotos(photos);
        } catch (error) {
            console.error('Ошибка при получении фото пользователя:', error);
        }
    };

    const fetchUserCourses = async () => {
        try {
            if (!id) return;
            const allCourses = await courseRepository().getAllCourses();
            // Фильтруем курсы, где пользователь является автором
            const userCourses = allCourses.filter(course => course.author_id === Number(id));
            setUserCourses(userCourses);
        } catch (error) {
            console.error('Ошибка при получении курсов пользователя:', error);
        }
    };

    const handleSaveName = async () => {
        if (!user || !id) return

        try {
            const updateData: IUpdateUserData = {
                nickname: editedName
            }
            await userRepository().updateUser(Number(id), updateData)
            setUser(prev => prev ? { ...prev, nickname: editedName } : null)
            setIsEditModalOpen(false)
        } catch (error) {
            console.error('Ошибка при обновлении имени:', error)
        }
    }

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !id) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            await userRepository().uploadPhoto(Number(id), { file });
            await fetchUserPhotos(); // Обновляем список фото после загрузки
        } catch (error) {
            console.error('Ошибка при загрузке фото:', error);
        }
    };

    const handleAddPhotoClick = () => {
        fileInputRef.current?.click();
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Пользователь не найден</div>
    }

    const tabs = [
        {
            id: "photo",
            label: "Фотографии",
            content: <PhotoGrid photos={userPhotos} />,
        },
        {
            id: "courses",
            label: "Курсы",
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                    {userCourses && userCourses.length > 0 ? (
                        userCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                            Нет доступных курсов
                        </div>
                    )}
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
                        <Avatar alt={user.nickname} size={avatarSize} />
                    </div>
                    <div className="bg-white rounded-t-3xl pt-16 sm:pt-20 pb-8 px-4 sm:px-8 mt-[-48px] sm:mt-[-64px] flex flex-col items-center relative z-0 w-full flex-1 min-h-0">
                        <div className="relative w-full">
                            <Link to="/" className="absolute -top-42 sm:-top-15 sm:left-0 inline-flex items-center text-white sm:text-gray-800 font-bold text-base">
                                ← Вернуться на главную
                            </Link>
                        </div>
                        <div className="relative w-full">
                            <div className="flex flex-col items-center mb-4">
                                <h1 className="mb-6 text-2xl sm:text-3xl font-bold">{user.nickname}</h1>
                                <div className="w-full flex flex-col items-center justify-center sm:flex-row gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handlePhotoUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={handleAddPhotoClick}
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
