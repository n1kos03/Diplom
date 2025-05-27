import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "shared/ui/accordion"
import { Input } from "shared/ui/input"
import { Plus, Trash2, FileText, Video, Paperclip, ChevronDown, ChevronUp } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { courseRepository } from "entities/course/api"
import { Header } from "widgets/header"

// Типы
function genId() { return Math.random().toString(36).slice(2, 10) }

type Block = {
    id: string
    title: string
    type: "video" | "document"
    description?: string
    files?: File[]
}

type Section = {
    id: string
    title: string
    blocks: Block[]
    apiId?: number
}

export const AddCourse = () => {
    const navigate = useNavigate()
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [sections, setSections] = useState<Section[]>([])
    const [expandedSection, setExpandedSection] = useState<string | null>(null)
    const [openBlocks, setOpenBlocks] = useState<{ [blockId: string]: boolean }>({})
    const [selectedFiles, setSelectedFiles] = useState<{ [blockId: string]: File | null }>({})
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Добавить раздел
    const addSection = () => {
        const newSection: Section = {
            id: genId(),
            title: `Раздел ${sections.length + 1}`,
            blocks: [],
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
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, blocks: [...s.blocks, { id: genId(), title: "Новый блок", type: "video" }] }
                : s
        ))
    }

    // Редактировать блок
    const editBlock = (sectionId: string, blockId: string, newTitle: string, newType: "video" | "document") => {
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
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, blocks: s.blocks.map(b => b.id === blockId ? { ...b, files: [file] } : b) }
                : s
        ))
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
        if (!title || !description) {
            setError("Пожалуйста, заполните название и описание курса")
            return
        }

        if (sections.length === 0) {
            setError("Добавьте хотя бы один раздел")
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            // 1. Создаем курс
            const courseResponse = await courseRepository().createCourse({
                title,
                description
            })
            const courseId = courseResponse.id

            // 2. Создаем все секции параллельно
            const sectionPromises = sections.map(async (section) => {
                const sectionResponse = await courseRepository().createSection(courseId, {
                    title: section.title,
                    description: ""
                })
                return { ...section, apiId: sectionResponse.id }
            })
            const createdSections = await Promise.all(sectionPromises)

            // 3. Загружаем все материалы и задания параллельно
            const uploadPromises = createdSections.flatMap(section => 
                section.blocks.map(async (block) => {
                    if (!block.files || block.files.length === 0) return

                    const file = block.files[0] // Берем первый файл
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('description', block.description || '')

                    if (block.type === 'document') {
                        // Загружаем как задание
                        const response = await fetch(`/courses/${courseId}/tasks/${section.apiId}`, {
                            method: 'POST',
                            body: formData
                        })
                        return response.json()
                    } else {
                        // Загружаем как материал
                        const response = await fetch(`/courses/${courseId}/materials/${section.apiId}`, {
                            method: 'POST',
                            body: formData
                        })
                        return response.json()
                    }
                })
            )

            await Promise.all(uploadPromises)

            // 4. Перенаправляем на страницу курса
            navigate(`/course/${courseId}`)
        } catch (err) {
            console.error('Ошибка при сохранении курса:', err)
            setError("Произошла ошибка при сохранении курса. Пожалуйста, попробуйте еще раз.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Header />

            <div className="flex flex-col w-full h-full">
                <div className="relative w-full p-4 z-0">
                    <div className="absolute top-0 left-0 w-full p-4 bg-blue-600 h-40 z-0">
                        <Link to="/" className="inline-flex items-center text-white font-bold text-base">
                            ← Вернуться на главную
                        </Link>
                    </div>
                </div>


                <div className="grow w-full pt-16 z-10">
                    <div className="w-full">
                        <div className="bg-white rounded-t-3xl border-t border-gray-200 p-6 sm:p-10">
                            <h1 className="text-3xl font-bold mb-2">Создание курса</h1>
                            <p className="text-gray-500 mb-6">Заполните основную информацию и структуру курса</p>
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
                                <div 
                                    onClick={addSection} 
                                    className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-100 px-3 py-2 rounded-md cursor-pointer hover:bg-blue-200 transition"
                                >
                                    <Plus className="w-4 h-4" /> Добавить раздел
                                </div>
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
                                                    {section.blocks.map((block) => {
                                                        const isOpen = !!openBlocks[block.id]
                                                        return (
                                                            <div key={block.id} className="rounded-xl">
                                                                <div
                                                                    className="flex items-center gap-4 w-full px-4 py-3 cursor-pointer rounded-xl"
                                                                    onClick={() => setOpenBlocks(prev => ({ ...prev, [block.id]: !isOpen }))}
                                                                >
                                                                    {block.type === "video" ? <Video className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-teal-400" />}
                                                                    <input
                                                                        className="font-semibold focus:border-blue-600 bg-transparent outline-none flex-1 transition"
                                                                        value={block.title}
                                                                        onChange={e => editBlock(section.id, block.id, e.target.value, block.type)}
                                                                        onClick={e => e.stopPropagation()}
                                                                    />
                                                                    <select
                                                                        className="border rounded px-2 py-1 text-xs"
                                                                        value={block.type}
                                                                        onChange={e => editBlock(section.id, block.id, block.title, e.target.value as "video" | "document")}
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        <option value="video">Лекция</option>
                                                                        <option value="document">Задание</option>
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
                                                                                            setSelectedFiles(prev => ({ ...prev, [block.id]: e.target.files![0] }))
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                            {selectedFiles[block.id] && (
                                                                                <div
                                                                                    className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded hover:bg-green-200 ml-2 cursor-pointer"
                                                                                    onClick={() => {
                                                                                        addBlockFile(section.id, block.id, selectedFiles[block.id]!)
                                                                                        setSelectedFiles(prev => ({ ...prev, [block.id]: null }))
                                                                                    }}
                                                                                >
                                                                                    Добавить: {selectedFiles[block.id]?.name}
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

                            {error && (
                                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            {sections.length > 0 && sections.every(section => section.blocks.length > 0) && (
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={saveCourse}
                                        disabled={isSaving}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow ${
                                            isSaving ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {isSaving ? 'Сохранение...' : 'Создать курс'}
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