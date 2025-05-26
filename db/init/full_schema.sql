--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4 (Debian 17.4-1.pgdg120+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: set_courses_to_anonymous(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_courses_to_anonymous() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
UPDATE "Course" SET "Author_id" = 0 WHERE "Author_id" = OLD."ID";
RETURN OLD;
END;
$$;


ALTER FUNCTION public.set_courses_to_anonymous() OWNER TO postgres;

--
-- Name: update_course_average_rating(); Type: FUNCTION; Schema: public; Owner: postgres
--

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


ALTER FUNCTION public.update_course_average_rating() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Comments" (
    id integer NOT NULL,
    course_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."Comments" OWNER TO postgres;

--
-- Name: Comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Comments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Comments_id_seq" OWNER TO postgres;

--
-- Name: Comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Comments_id_seq" OWNED BY public."Comments".id;


--
-- Name: Course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Course" (
    "ID" integer NOT NULL,
    "Author_id" integer NOT NULL,
    "Title" character varying(255) NOT NULL,
    "Description" text NOT NULL,
    "Created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    average_rating double precision DEFAULT 0
);


ALTER TABLE public."Course" OWNER TO postgres;

--
-- Name: Course_ID_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Course_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Course_ID_seq" OWNER TO postgres;

--
-- Name: Course_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Course_ID_seq" OWNED BY public."Course"."ID";


--
-- Name: Course_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Course_materials" (
    "ID" integer NOT NULL,
    "Course_id" integer NOT NULL,
    "Content_URL" text NOT NULL,
    "Description" text,
    "Uploaded_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    section_id bigint
);


ALTER TABLE public."Course_materials" OWNER TO postgres;

--
-- Name: Course_materials_ID_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Course_materials_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Course_materials_ID_seq" OWNER TO postgres;

--
-- Name: Course_materials_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Course_materials_ID_seq" OWNED BY public."Course_materials"."ID";


--
-- Name: Subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subscriptions" (
    "User_id" integer NOT NULL,
    "Course_id" integer NOT NULL,
    "Subscribed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Subscriptions" OWNER TO postgres;

--
-- Name: Subscriptions_Course_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Subscriptions_Course_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Subscriptions_Course_id_seq" OWNER TO postgres;

--
-- Name: Subscriptions_Course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subscriptions_Course_id_seq" OWNED BY public."Subscriptions"."Course_id";


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    "ID" integer NOT NULL,
    "Nickname" character varying(255) NOT NULL,
    "Password" character varying(255) NOT NULL,
    "Email" character varying(255) NOT NULL,
    "Bio" text DEFAULT ''::text NOT NULL,
    "Created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_ID_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_ID_seq" OWNER TO postgres;

--
-- Name: User_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_ID_seq" OWNED BY public."User"."ID";


--
-- Name: User_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User_photos" (
    id integer NOT NULL,
    "User_id" integer NOT NULL,
    "Content_url" text NOT NULL,
    "Uploaded_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."User_photos" OWNER TO postgres;

--
-- Name: course_rating; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_rating (
    id integer NOT NULL,
    course_id bigint,
    user_id bigint,
    rating integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_rating_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.course_rating OWNER TO postgres;

--
-- Name: course_rating_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_rating_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_rating_id_seq OWNER TO postgres;

--
-- Name: course_rating_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_rating_id_seq OWNED BY public.course_rating.id;


--
-- Name: course_task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_task (
    id integer NOT NULL,
    course_id integer,
    section_id integer,
    content_url text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_task OWNER TO postgres;

--
-- Name: course_task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_task_id_seq OWNER TO postgres;

--
-- Name: course_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_task_id_seq OWNED BY public.course_task.id;


--
-- Name: section; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.section (
    id integer NOT NULL,
    course_id bigint,
    title text NOT NULL,
    description text
);


ALTER TABLE public.section OWNER TO postgres;

--
-- Name: section_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.section_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.section_id_seq OWNER TO postgres;

--
-- Name: section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.section_id_seq OWNED BY public.section.id;


--
-- Name: task_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_reviews (
    id integer NOT NULL,
    answer_id integer,
    grade smallint NOT NULL,
    author_comment text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT task_reviews_grade_check CHECK (((grade >= 1) AND (grade <= 5)))
);


ALTER TABLE public.task_reviews OWNER TO postgres;

--
-- Name: task_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_reviews_id_seq OWNER TO postgres;

--
-- Name: task_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_reviews_id_seq OWNED BY public.task_reviews.id;


--
-- Name: user_answer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_answer (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    content_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_answer OWNER TO postgres;

--
-- Name: user_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_answer_id_seq OWNER TO postgres;

--
-- Name: user_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_answer_id_seq OWNED BY public.user_answer.id;


--
-- Name: user_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_photos_id_seq OWNER TO postgres;

--
-- Name: user_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_photos_id_seq OWNED BY public."User_photos".id;


--
-- Name: Comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comments" ALTER COLUMN id SET DEFAULT nextval('public."Comments_id_seq"'::regclass);


--
-- Name: Course ID; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course" ALTER COLUMN "ID" SET DEFAULT nextval('public."Course_ID_seq"'::regclass);


--
-- Name: Course_materials ID; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course_materials" ALTER COLUMN "ID" SET DEFAULT nextval('public."Course_materials_ID_seq"'::regclass);


--
-- Name: User ID; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN "ID" SET DEFAULT nextval('public."User_ID_seq"'::regclass);


--
-- Name: User_photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_photos" ALTER COLUMN id SET DEFAULT nextval('public.user_photos_id_seq'::regclass);


--
-- Name: course_rating id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_rating ALTER COLUMN id SET DEFAULT nextval('public.course_rating_id_seq'::regclass);


--
-- Name: course_task id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_task ALTER COLUMN id SET DEFAULT nextval('public.course_task_id_seq'::regclass);


--
-- Name: section id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.section ALTER COLUMN id SET DEFAULT nextval('public.section_id_seq'::regclass);


--
-- Name: task_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_reviews ALTER COLUMN id SET DEFAULT nextval('public.task_reviews_id_seq'::regclass);


--
-- Name: user_answer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer ALTER COLUMN id SET DEFAULT nextval('public.user_answer_id_seq'::regclass);


--
-- Name: Comments Comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_pkey" PRIMARY KEY (id);


--
-- Name: Course_materials Course_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course_materials"
    ADD CONSTRAINT "Course_materials_pkey" PRIMARY KEY ("ID");


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("ID");


--
-- Name: Subscriptions Subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("User_id", "Course_id");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("ID");


--
-- Name: course_rating course_rating_course_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_rating
    ADD CONSTRAINT course_rating_course_id_user_id_key UNIQUE (course_id, user_id);


--
-- Name: course_rating course_rating_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_rating
    ADD CONSTRAINT course_rating_pkey PRIMARY KEY (id);


--
-- Name: course_task course_task_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_task
    ADD CONSTRAINT course_task_pkey PRIMARY KEY (id);


--
-- Name: section section_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_pkey PRIMARY KEY (id);


--
-- Name: task_reviews task_reviews_answer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_reviews
    ADD CONSTRAINT task_reviews_answer_id_key UNIQUE (answer_id);


--
-- Name: task_reviews task_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_reviews
    ADD CONSTRAINT task_reviews_pkey PRIMARY KEY (id);


--
-- Name: user_answer user_answer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_pkey PRIMARY KEY (id);


--
-- Name: user_answer user_answer_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_task_id_user_id_key UNIQUE (task_id, user_id);


--
-- Name: User_photos user_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_photos"
    ADD CONSTRAINT user_photos_pkey PRIMARY KEY (id);


--
-- Name: User before_delete_user_update_courses; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER before_delete_user_update_courses BEFORE DELETE ON public."User" FOR EACH ROW EXECUTE FUNCTION public.set_courses_to_anonymous();


--
-- Name: course_rating trg_update_rating_after_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_rating_after_delete AFTER DELETE ON public.course_rating FOR EACH ROW EXECUTE FUNCTION public.update_course_average_rating();


--
-- Name: course_rating trg_update_rating_after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_rating_after_insert AFTER INSERT ON public.course_rating FOR EACH ROW EXECUTE FUNCTION public.update_course_average_rating();


--
-- Name: course_rating trg_update_rating_after_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_rating_after_update AFTER UPDATE OF rating ON public.course_rating FOR EACH ROW EXECUTE FUNCTION public.update_course_average_rating();


--
-- Name: Comments Comments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public."Course"("ID") ON DELETE CASCADE;


--
-- Name: Comments Comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"("ID") ON DELETE SET NULL;


--
-- Name: Course Course_Author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_Author_id_fkey" FOREIGN KEY ("Author_id") REFERENCES public."User"("ID") ON DELETE SET NULL;


--
-- Name: Course_materials Course_materials_Course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course_materials"
    ADD CONSTRAINT "Course_materials_Course_id_fkey" FOREIGN KEY ("Course_id") REFERENCES public."Course"("ID");


--
-- Name: Course_materials Course_materials_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course_materials"
    ADD CONSTRAINT "Course_materials_section_id_fkey" FOREIGN KEY (section_id) REFERENCES public.section(id) ON DELETE SET NULL;


--
-- Name: Subscriptions Subscriptions_Course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_Course_id_fkey" FOREIGN KEY ("Course_id") REFERENCES public."Course"("ID");


--
-- Name: Subscriptions Subscriptions_User_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_User_id_fkey" FOREIGN KEY ("User_id") REFERENCES public."User"("ID");


--
-- Name: course_rating course_rating_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_rating
    ADD CONSTRAINT course_rating_course_id_fkey FOREIGN KEY (course_id) REFERENCES public."Course"("ID") ON DELETE CASCADE;


--
-- Name: course_rating course_rating_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_rating
    ADD CONSTRAINT course_rating_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"("ID") ON DELETE CASCADE;


--
-- Name: course_task course_task_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_task
    ADD CONSTRAINT course_task_course_id_fkey FOREIGN KEY (course_id) REFERENCES public."Course"("ID");


--
-- Name: course_task course_task_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_task
    ADD CONSTRAINT course_task_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.section(id) ON DELETE CASCADE;


--
-- Name: section section_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_course_id_fkey FOREIGN KEY (course_id) REFERENCES public."Course"("ID") ON DELETE CASCADE;


--
-- Name: task_reviews task_reviews_answer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_reviews
    ADD CONSTRAINT task_reviews_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.user_answer(id) ON DELETE CASCADE;


--
-- Name: user_answer user_answer_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.course_task(id);


--
-- Name: user_answer user_answer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"("ID");


--
-- Name: User_photos user_photos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User_photos"
    ADD CONSTRAINT user_photos_user_id_fkey FOREIGN KEY ("User_id") REFERENCES public."User"("ID");


--
-- PostgreSQL database dump complete
--

