
-- Создаем функции
CREATE FUNCTION public.set_courses_to_anonymous() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE "Course" SET "Author_id" = 0 WHERE "Author_id" = OLD."ID";
    RETURN OLD;
END;
$$;

CREATE FUNCTION public.update_course_average_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    affected_course_id BIGINT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        affected_course_id := OLD.course_id;
    ELSE
        affected_course_id := NEW.course_id;
    END IF;

    UPDATE "Course"
    SET average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM course_rating
        WHERE course_id = affected_course_id
    )
    WHERE "ID" = affected_course_id;

    RETURN NULL;
END;
$$;

-- Создаем таблицы
CREATE TABLE public."User" (
    "ID" SERIAL PRIMARY KEY,
    "Nickname" VARCHAR(255) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Bio" TEXT DEFAULT '' NOT NULL,
    "Created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public."Course" (
    "ID" SERIAL PRIMARY KEY,
    "Author_id" INTEGER NOT NULL REFERENCES public."User"("ID") ON DELETE SET NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Description" TEXT NOT NULL,
    "Created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    average_rating DOUBLE PRECISION DEFAULT 0
);

CREATE TABLE public."Comments" (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public."Course"("ID") ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public."User"("ID") ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."Course_materials" (
    "ID" SERIAL PRIMARY KEY,
    "Course_id" INTEGER NOT NULL REFERENCES public."Course"("ID"),
    "Content_URL" TEXT NOT NULL,
    "Description" TEXT,
    "Uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    section_id BIGINT,
    order_number INTEGER
);

CREATE TABLE public."Subscriptions" (
    "User_id" INTEGER NOT NULL REFERENCES public."User"("ID"),
    "Course_id" INTEGER NOT NULL REFERENCES public."Course"("ID"),
    "Subscribed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("User_id", "Course_id")
);

CREATE TABLE public."User_photos" (
    id SERIAL PRIMARY KEY,
    "User_id" INTEGER NOT NULL REFERENCES public."User"("ID"),
    "Content_url" TEXT NOT NULL,
    "Uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.course_rating (
    id SERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES public."Course"("ID") ON DELETE CASCADE,
    user_id BIGINT REFERENCES public."User"("ID") ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, user_id)
);

CREATE TABLE public.section (
    id SERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES public."Course"("ID") ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE public.course_task (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES public."Course"("ID"),
    section_id INTEGER REFERENCES public.section(id) ON DELETE CASCADE,
    content_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_number INTEGER
);

CREATE TABLE public.user_answer (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES public.course_task(id),
    user_id INTEGER REFERENCES public."User"("ID"),
    content_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (task_id, user_id)
);

CREATE TABLE public.task_reviews (
    id SERIAL PRIMARY KEY,
    answer_id INTEGER UNIQUE REFERENCES public.user_answer(id) ON DELETE CASCADE,
    grade SMALLINT NOT NULL CHECK (grade >= 1 AND grade <= 5),
    author_comment TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем триггеры
CREATE TRIGGER before_delete_user_update_courses 
    BEFORE DELETE ON public."User" 
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_courses_to_anonymous();

CREATE TRIGGER trg_update_rating_after_delete 
    AFTER DELETE ON public.course_rating 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_course_average_rating();

CREATE TRIGGER trg_update_rating_after_insert 
    AFTER INSERT ON public.course_rating 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_course_average_rating();

CREATE TRIGGER trg_update_rating_after_update 
    AFTER UPDATE OF rating ON public.course_rating 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_course_average_rating();