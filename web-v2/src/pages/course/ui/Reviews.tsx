import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseRepository } from 'entities/course/api';
import { Header } from 'widgets/header';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { StarRating } from 'shared/ui/rating';
import type { IUserAnswer, ITaskReview, ICreateReviewData } from 'entities/course/model/types';

export const Reviews = () => {
    const { courseId, taskId } = useParams();
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<IUserAnswer[]>([]);
    const [reviews, setReviews] = useState<Record<number, ITaskReview>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<Record<number, boolean>>({});
    const [newRatings, setNewRatings] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!courseId || !taskId) return;

            try {
                setIsLoading(true);
                // Получаем информацию о курсе
                const courseData = await courseRepository().getCourseById(Number(courseId));

                // Проверяем, является ли текущий пользователь автором курса
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    navigate(`/course/${courseId}`);
                    return;
                }

                const user = JSON.parse(userStr);
                if (courseData.author_id !== user.user.id) {
                    navigate(`/course/${courseId}`);
                    return;
                }

                const answersData = await courseRepository().getAnswers(Number(courseId), Number(taskId));
                setAnswers(answersData || []);

                const reviewsPromises = (answersData || []).map(answer =>
                    courseRepository().getReview(answer.id)
                );
                const reviewsData = await Promise.all(reviewsPromises);

                const reviewsMap: Record<number, ITaskReview> = {};
                reviewsData.forEach(review => {
                    if (review) {
                        reviewsMap[review.answer_id] = review;
                    }
                });
                setReviews(reviewsMap);
            } catch (err) {
                setError('Ошибка при загрузке данных');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [courseId, taskId, navigate]);

    const handleCreateReview = async (answerId: number, reviewData: ICreateReviewData) => {
        try {
            setIsSubmitting(prev => ({ ...prev, [answerId]: true }));
            await courseRepository().createReview(answerId, reviewData);
            const newReview = await courseRepository().getReview(answerId);
            setReviews(prev => ({
                ...prev,
                [answerId]: newReview
            }));
        } catch (err) {
            console.error('Ошибка при создании отзыва:', err);
        } finally {
            setIsSubmitting(prev => ({ ...prev, [answerId]: false }));
        }
    };

    const handleDeleteReview = async (reviewId: number, answerId: number) => {
        try {
            await courseRepository().deleteReview(answerId, reviewId);
            setReviews(prev => {
                const newReviews = { ...prev };
                delete newReviews[answerId];
                return newReviews;
            });
        } catch (err) {
            console.error('Ошибка при удалении отзыва:', err);
        }
    };

    const handleRatingChange = (answerId: number, rating: number) => {
        setNewRatings(prev => ({
            ...prev,
            [answerId]: rating
        }));
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">Загрузка...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-red-500">{error}</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(`/course/${courseId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                        Назад
                    </button>
                    <h1 className="text-2xl font-bold">Ответы на задание</h1>
                </div>

                {answers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 text-lg">Пока нет ответов на это задание</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {answers.map(answer => (
                            <div key={answer.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold mb-3">Ответ пользователя</h3>
                                    <p className="text-gray-600 mb-4">
                                        Дата: {new Date(answer.created_at).toLocaleDateString()}
                                    </p>
                                    <a
                                        href={answer.content_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Скачать ответ
                                    </a>
                                </div>

                                {reviews[answer.id] ? (
                                    <div className="mt-6 p-6 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-lg font-semibold">Отзыв автора</h4>
                                            <button
                                                onClick={() => handleDeleteReview(reviews[answer.id].id, answer.id)}
                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <p className="text-gray-700 mb-3">{reviews[answer.id].author_comment}</p>
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={reviews[answer.id].grade} totalStars={5} />
                                            <span className="text-sm text-gray-600">{reviews[answer.id].grade}/5</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold mb-4">Добавить отзыв</h4>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.target as HTMLFormElement;
                                            const comment = form.comment.value;
                                            const rating = newRatings[answer.id] || 0;
                                            handleCreateReview(answer.id, { grade: rating, author_comment: comment });
                                        }}>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Оценка
                                                </label>
                                                <StarRating
                                                    rating={newRatings[answer.id] || 0}
                                                    totalStars={5}
                                                    onRatingChange={(rating) => handleRatingChange(answer.id, rating)}
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Комментарий
                                                </label>
                                                <textarea
                                                    name="comment"
                                                    required
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows={4}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting[answer.id] || !newRatings[answer.id]}
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting[answer.id] ? 'Отправка...' : 'Отправить отзыв'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};