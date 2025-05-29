import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "shared/ui/accordion"
import { Input } from "shared/ui/input"
import { Plus, Trash2, FileText, Video, Paperclip, ChevronDown, ChevronUp } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Header } from "widgets/header"
import { courseRepository } from "entities/course/api"
import type { ICourseMaterial, ICourseTask } from "entities/course/model/types"

// Типы
function genId() { return Math.random().toString(36).slice(2, 10) }

type Block = {
    id: string
    title: string
    type: "material" | "task"
    apiId?: number
    description?: string
    files?: File[]
    order_number?: number
}

type Section = {
    id: string
    title: string
    blocks: Block[]
    apiId?: number
}

export const EditCourse = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [sections, setSections] = useState<Section[]>([])
    const [expandedSection, setExpandedSection] = useState<string | null>(null)
    const [openBlocks, setOpenBlocks] = useState<{ [blockId: string]: boolean }>({})
    const [selectedFiles, setSelectedFiles] = useState<{ [blockId: string]: File | null }>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [materialsData, setMaterialsData] = useState<ICourseMaterial[]>([])
    const [tasksData, setTasksData] = useState<ICourseTask[]>([])

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id) return
            
            try {
                setIsLoading(true)
                setError(null)
                
                // Получаем основную информацию о курсе
                const courseData = await courseRepository().getCourseById(Number(id))
                setTitle(courseData.title)
                setDescription(courseData.description)

                // Получаем секции курса
                const sectionsData = await courseRepository().getSections(Number(id))
                
                // Получаем материалы и задания для каждой секции
                const materials = await courseRepository().getMaterials(Number(id)) || []
                const tasks = await courseRepository().getTasks(Number(id)) || []
                
                setMaterialsData(materials)
                setTasksData(tasks)

                // Преобразуем данные в формат для редактирования
                const formattedSections = sectionsData.map(section => {
                    const sectionMaterials = materials.filter(m => m.section_id === section.id)
                    const sectionTasks = tasks.filter(t => t.section_id === section.id)

                    return {
                        id: genId(),
                        apiId: section.id,
                        title: section.title,
                        blocks: [
                            ...sectionMaterials.map(material => ({
                                id: genId(),
                                apiId: material.id,
                                title: material.title,
                                type: "material" as const,
                                description: material.description
                            })),
                            ...sectionTasks.map(task => ({
                                id: genId(),
                                apiId: task.id,
                                title: task.title,
                                type: "task" as const,
                                description: task.description
                            }))
                        ]
                    }
                })

                setSections(formattedSections)
            } catch (err) {
                console.error('Ошибка при загрузке данных курса:', err)
                if (err instanceof Error) {
                    setError(`Ошибка при загрузке данных курса: ${err.message}`)
                } else {
                    setError('Не удалось загрузить информацию о курсе')
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseData()
    }, [id])

    // Добавить раздел
    const addSection = () => {
        const newSection: Section = {
            id: genId(),
            title: `Раздел ${sections.length + 1}`,
            blocks: []
        }
        setSections([...sections, newSection])
    }

    // Редактировать раздел
    const editSectionTitle = (id: string, newTitle: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s))
    }

    // Удалить раздел
    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id))
    }

    // Добавить блок
    const addBlock = (sectionId: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                // Находим максимальный order_number среди существующих блоков
                const maxOrderNumber = s.blocks.length > 0 
                    ? Math.max(...s.blocks.map(b => {
                        if (b.apiId) {
                            return b.type === "material" 
                                ? materialsData.find(m => m.id === b.apiId)?.order_number || 0
                                : tasksData.find(t => t.id === b.apiId)?.order_number || 0
                        }
                        return 0
                    }))
                    : 0;
                
                return { 
                    ...s, 
                    blocks: [...s.blocks, { 
                        id: genId(), 
                        title: "Новый блок", 
                        type: "material",
                        order_number: maxOrderNumber + 1
                    }] 
                }
            }
            return s
        }))
    }

    // Редактировать блок
    const editBlock = (sectionId: string, blockId: string, newTitle: string, newType: "material" | "task") => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, blocks: s.blocks.map(b => b.id === blockId ? { ...b, title: newTitle, type: newType } : b) }
                : s
        ))
    }

    // Удалить блок
    const removeBlock = (sectionId: string, blockId: string) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, blocks: s.blocks.filter(b => b.id !== blockId) }
                : s
        ))
    }

    // Редактировать описание блока
    const editBlockDescription = (sectionId: string, blockId: string, newDescription: string) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, blocks: s.blocks.map(b => b.id === blockId ? { ...b, description: newDescription } : b) }
                : s
        ))
    }

    // Добавить файл к блоку
    const addBlockFile = (sectionId: string, blockId: string, file: File) => {
        console.log('Добавляем файл в блок:', { sectionId, blockId, file });
        console.log('Текущие секции:', sections);
        setSections(prevSections => {
            const newSections = prevSections.map(section => {
                if (section.id === sectionId) {
                    console.log('Нашли секцию:', section);
                    return {
                        ...section,
                        blocks: section.blocks.map(block => {
                            if (block.id === blockId) {
                                console.log('Обновляем блок:', block);
                                const updatedBlock = {
                                    ...block,
                                    files: [file]
                                };
                                console.log('Обновленный блок:', updatedBlock);
                                return updatedBlock;
                            }
                            return block;
                        })
                    };
                }
                return section;
            });
            console.log('Новые секции:', newSections);
            return newSections;
        });
    }

    // Удалить файл из блока
    const removeBlockFile = (sectionId: string, blockId: string, fileIdx: number) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, blocks: s.blocks.map(b => b.id === blockId ? { ...b, files: (b.files || []).filter((_, i) => i !== fileIdx) } : b) }
                : s
        ))
    }

    const saveCourse = async () => {
        if (!id) return

        try {
            console.log('Начинаем сохранение курса...')
            
            // Обновляем основную информацию о курсе
            console.log('Обновляем основную информацию о курсе...')
            await courseRepository().updateCourse(Number(id), {
                title,
                description
            })

            // Обновляем секции
            for (const section of sections) {
                console.log(`Обрабатываем секцию: ${section.title}`)
                
                if (section.apiId) {
                    // Обновляем существующую секцию
                    console.log('Обновляем существующую секцию...')
                    await courseRepository().updateSection(section.apiId, {
                        title: section.title,
                        description: section.title
                    })
                } else {
                    // Создаем новую секцию
                    console.log('Создаем новую секцию...')
                    const newSection = await courseRepository().createSection(Number(id), {
                        title: section.title,
                        description: section.title
                    })
                    section.apiId = newSection.id
                }

                // Получаем текущие материалы и задания для секции
                console.log('Получаем текущие материалы и задания...')
                const currentMaterials = await courseRepository().getMaterials(Number(id)) || []
                const currentTasks = await courseRepository().getTasks(Number(id)) || []
                const sectionMaterials = (currentMaterials || []).filter(m => m.section_id === section.apiId)
                const sectionTasks = (currentTasks || []).filter(t => t.section_id === section.apiId)

                console.log('Текущие материалы:', sectionMaterials)
                console.log('Текущие задания:', sectionTasks)

                // Обновляем блоки (материалы и задания)
                for (const block of section.blocks) {
                    console.log(`Обрабатываем блок: ${block.title} (тип: ${block.type})`)
                    
                    const orderNumber = section.blocks.indexOf(block) + 1;
                    
                    if (block.apiId) {
                        // Если блок существует и не изменился, пропускаем его
                        const existingMaterial = sectionMaterials.find(m => m.id === block.apiId)
                        const existingTask = sectionTasks.find(t => t.id === block.apiId)
                        
                        // Если изменилось только название или порядок, обновляем
                        if ((block.type === "material" && existingMaterial) ||
                            (block.type === "task" && existingTask)) {
                            console.log('Обновляем существующий блок...')
                            if (block.type === "material") {
                                await courseRepository().updateMaterial(
                                    Number(id),
                                    section.apiId!,
                                    block.apiId!,
                                    block.description || block.title,
                                    orderNumber
                                )
                            } else {
                                await courseRepository().updateTask(
                                    Number(id),
                                    section.apiId!,
                                    block.apiId!,
                                    block.description || block.title,
                                    orderNumber
                                )
                            }
                            continue
                        }

                        // Если изменился тип блока, удаляем старый и создаем новый
                        console.log('Тип блока изменился, удаляем старый...')
                        if (block.type === "material") {
                            await courseRepository().deleteMaterial(Number(id), section.apiId!, block.apiId!)
                        } else {
                            await courseRepository().deleteTask(block.apiId!)
                        }
                    }

                    // Создаем новый блок
                    console.log('Создаем новый блок...', block);
                    console.log('Файлы в блоке:', block.files);
                    try {
                        if (!block.files?.[0]) {
                            console.log('Файл не найден в блоке:', block);
                            throw new Error('Файл не выбран')
                        }

                        const file = block.files[0];
                        console.log('Файл найден:', file);

                        // Проверяем размер файла перед загрузкой
                        if (file.size > 100 * 1024 * 1024) {
                            throw new Error('Размер файла не должен превышать 100MB');
                        }

                        if (block.type === "material") {
                            const newMaterial = await courseRepository().uploadMaterial(Number(id), section.apiId!, {
                                title: block.title,
                                description: block.description || "",
                                file: file,
                                order_number: orderNumber
                            })
                            block.apiId = newMaterial.id
                            console.log('Материал создан:', newMaterial)
                        } else {
                            console.log('Загружаем задание с файлом:', file);
                            const newTask = await courseRepository().uploadTask(Number(id), section.apiId!, {
                                title: block.title,
                                description: block.description || "",
                                file: file,
                                order_number: orderNumber
                            })
                            block.apiId = newTask.id
                            console.log('Задание создано:', newTask)
                        }
                    } catch (err) {
                        console.error('Ошибка при создании блока:', err)
                        if (err instanceof Error) {
                            if (err.message.includes('net::ERR_CONNECTION_RESET')) {
                                throw new Error('Ошибка загрузки файла: соединение с сервером было сброшено. Возможно, файл слишком большой или сервер не отвечает.');
                            }
                            throw err;
                        }
                        throw new Error('Неизвестная ошибка при загрузке файла');
                    }
                }

                // Удаляем блоки, которые были удалены пользователем
                console.log('Проверяем удаленные блоки...')
                for (const material of sectionMaterials) {
                    if (!section.blocks.some(b => b.apiId === material.id)) {
                        console.log('Удаляем материал:', material)
                        await courseRepository().deleteMaterial(Number(id), section.apiId!, material.id)
                    }
                }
                for (const task of sectionTasks) {
                    if (!section.blocks.some(b => b.apiId === task.id)) {
                        console.log('Удаляем задание:', task)
                        await courseRepository().deleteTask(task.id)
                    }
                }
            }

            console.log('Сохранение успешно завершено')
            // Перенаправляем на страницу курса
            navigate(`/course/${id}`)
        } catch (err) {
            console.error('Ошибка при сохранении курса:', err)
            if (err instanceof Error) {
                setError(`Не удалось сохранить изменения: ${err.message}`)
            } else {
                setError('Не удалось сохранить изменения')
            }
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
            <div className="flex flex-col w-full h-full">
                <div className="relative w-full p-4 z-0">
                    <div className="absolute top-0 left-0 w-full p-4 bg-blue-600 h-40 z-0">
                        <Link to={`/course/${id}`} className="inline-flex items-center text-white font-bold text-base">
                            ← Вернуться к курсу
                        </Link>
                    </div>
                </div>

                <div className="grow w-full pt-16 z-10">
                    <div className="w-full">
                        <div className="bg-white rounded-t-3xl border-t border-gray-200 p-6 sm:p-10">
                            <h1 className="text-3xl font-bold mb-2">Редактирование курса</h1>
                            <p className="text-gray-500 mb-6">Измените основную информацию и структуру курса</p>
                            <div className="mb-8">
                                <Input
                                    className="mb-3 text-2xl font-bold bg-white placeholder:text-gray-400 placeholder:font-normal"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Название курса"
                                />
                                <textarea
                                    className="w-full border border-gray-200 bg-white rounded-lg p-3 min-h-[80px] text-base transition placeholder:text-gray-400"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Описание курса"
                                />
                            </div>
                            <div className="mb-4 flex justify-between items-center">
                                <h2 className="text-2xl font-semibold">Содержание курса</h2>
                                <button onClick={addSection} className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-100 px-3 py-2 rounded-md cursor-pointer hover:bg-blue-200 transition">
                                    <Plus className="w-4 h-4" /> Добавить раздел
                                </button>
                            </div>

                            {sections.length ? (
                                <Accordion 
                                    type="single" 
                                    collapsible 
                                    value={expandedSection || undefined} 
                                    onValueChange={(value: string | undefined) => setExpandedSection(value || null)} 
                                    className="rounded-xl flex flex-col gap-2"
                                >
                                    {sections.map((section) => (
                                        <AccordionItem value={section.id} key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <AccordionTrigger className="px-4 py-3 hover:no-underline cursor-pointer">
                                                <div className="flex items-center gap-4 w-full">
                                                    <input
                                                        className="font-bold text-lg border-b border-gray-200 bg-transparent outline-none flex-1 transition"
                                                        value={section.title}
                                                        onChange={e => editSectionTitle(section.id, e.target.value)}
                                                    />
                                                    <div 
                                                        onClick={e => { e.stopPropagation(); addBlock(section.id) }} 
                                                        className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md cursor-pointer hover:bg-indigo-200 transition"
                                                    >
                                                        <Plus className="w-4 h-4" /> Блок
                                                    </div>
                                                    <div 
                                                        onClick={e => { e.stopPropagation(); removeSection(section.id) }} 
                                                        className="mr-2 flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-md cursor-pointer hover:bg-red-200 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0">
                                                <div className="space-y-2">
                                                    {section.blocks
                                                        .sort((a, b) => {
                                                            // Используем order_number из самого блока, если его нет - берем из API
                                                            const aOrder = a.order_number || (a.apiId ? 
                                                                (a.type === "material" ? 
                                                                    materialsData.find((m: ICourseMaterial) => m.id === a.apiId)?.order_number || 0 :
                                                                    tasksData.find((t: ICourseTask) => t.id === a.apiId)?.order_number || 0) : 0);
                                                            const bOrder = b.order_number || (b.apiId ? 
                                                                (b.type === "material" ? 
                                                                    materialsData.find((m: ICourseMaterial) => m.id === b.apiId)?.order_number || 0 :
                                                                    tasksData.find((t: ICourseTask) => t.id === b.apiId)?.order_number || 0) : 0);
                                                            return aOrder - bOrder;
                                                        })
                                                        .map((block) => {
                                                            const isOpen = !!openBlocks[block.id]
                                                            return (
                                                                <div key={block.id} className="rounded-xl">
                                                                    <div
                                                                        className="flex items-center gap-4 w-full px-4 py-3 cursor-pointer rounded-xl"
                                                                        onClick={() => setOpenBlocks(prev => ({ ...prev, [block.id]: !isOpen }))}
                                                                    >
                                                                        {block.type === "material" ? <Video className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-teal-400" />}
                                                                        <input
                                                                            className="font-semibold focus:border-blue-600 bg-transparent outline-none flex-1 transition"
                                                                            value={block.title}
                                                                            onChange={e => editBlock(section.id, block.id, e.target.value, block.type)}
                                                                            onClick={e => e.stopPropagation()}
                                                                        />
                                                                        <select
                                                                            className="border rounded px-2 py-1 text-xs"
                                                                            value={block.type}
                                                                            onChange={e => editBlock(section.id, block.id, block.title, e.target.value as "material" | "task")}
                                                                            onClick={e => e.stopPropagation()}
                                                                        >
                                                                            <option value="material">Материал</option>
                                                                            <option value="task">Задание</option>
                                                                        </select>
                                                                        <div 
                                                                            onClick={e => { e.stopPropagation(); removeBlock(section.id, block.id) }} 
                                                                            className="-mr-2 flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-md cursor-pointer hover:bg-red-200 transition"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </div>
                                                                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />}
                                                                    </div>
                                                                    {isOpen && (
                                                                        <div className="px-4 py-3 rounded-b-xl">
                                                                            <textarea
                                                                                className="w-full border bg-white border-gray-200 focus:border-blue-400 rounded-lg p-2 mb-2 text-sm transition"
                                                                                placeholder="Описание блока"
                                                                                value={block.description || ""}
                                                                                onChange={e => editBlockDescription(section.id, block.id, e.target.value)}
                                                                            />
                                                                            <div className="mb-2 flex items-center gap-2">
                                                                                <label className="flex items-center gap-2 cursor-pointer text-blue-600 font-medium hover:underline">
                                                                                    <Paperclip className="w-5 h-5" />
                                                                                    <span>Добавить файл</span>
                                                                                    <input
                                                                                        type="file"
                                                                                        className="hidden"
                                                                                        onChange={e => {
                                                                                            if (e.target.files && e.target.files[0]) {
                                                                                                const file = e.target.files[0];
                                                                                                // Проверяем размер файла (максимум 100MB)
                                                                                                if (file.size > 100 * 1024 * 1024) {
                                                                                                    alert('Размер файла не должен превышать 100MB');
                                                                                                    return;
                                                                                                }
                                                                                                console.log('Выбран файл:', file);
                                                                                                setSelectedFiles(prev => ({ ...prev, [block.id]: file }));
                                                                                                // Сразу добавляем файл в блок
                                                                                                addBlockFile(section.id, block.id, file);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </label>
                                                                                {selectedFiles[block.id] && (
                                                                                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded hover:bg-green-200 ml-2">
                                                                                        Выбран: {selectedFiles[block.id]?.name}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {block.files && block.files.length > 0 && (
                                                                                <ul className="mb-2">
                                                                                    {block.files.map((file, i) => (
                                                                                        <li key={file.name} className="flex items-center gap-2 text-sm">
                                                                                            <FileText className="w-4 h-4 text-gray-400" />
                                                                                            <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate max-w-[180px]">{file.name}</a>
                                                                                            <div 
                                                                                                onClick={() => removeBlockFile(section.id, block.id, i)} 
                                                                                                className="text-xs text-red-600 ml-2 hover:underline cursor-pointer"
                                                                                            >
                                                                                                Удалить
                                                                                            </div>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="mt-10 flex justify-center text-gray-500 text-lg">
                                    Добавьте новые разделы и блоки
                                </div>
                            )}

                            {sections.length > 0 && sections.every(section => section.blocks.length > 0) && (
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={saveCourse}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
                                    >
                                        Сохранить изменения
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}