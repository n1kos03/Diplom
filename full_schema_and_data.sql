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
-- Data for Name: Comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Comments" (id, course_id, user_id, content, created_at) FROM stdin;
2	1	8	Privet	2025-05-12 22:04:27.46595
8	2	8	New comment	2025-05-12 23:38:16.249584
11	1	8	New comment	2025-05-13 07:21:14.037195
12	1	8	New comment	2025-05-13 07:55:49.496058
13	1	8	New comment	2025-05-13 07:56:01.453751
14	1	8	New comment	2025-05-13 08:13:23.568057
15	1	8	New comment	2025-05-13 08:19:04.249364
16	1	8	New comment	2025-05-13 08:21:48.973719
17	1	8	New comment	2025-05-13 08:43:16.72779
18	1	8	New comment	2025-05-13 09:08:36.0662
19	1	8	New comment	2025-05-13 09:12:37.52582
20	1	8	New comment	2025-05-13 09:16:34.403113
21	1	8	New comment	2025-05-13 09:20:42.348847
54	1	8	New comment	2025-05-13 09:37:51.715555
55	1	8	New comment	2025-05-13 09:48:34.323209
56	1	8	New comment	2025-05-13 10:31:17.50373
57	1	8	New comment	2025-05-13 11:03:39.175833
58	1	8	New comment	2025-05-13 11:14:01.03357
59	1	8	New comment	2025-05-13 11:46:00.026516
60	1	8	New comment	2025-05-13 11:59:49.444625
61	1	8	New comment	2025-05-13 12:29:37.73115
62	1	8	New comment	2025-05-13 12:41:37.125483
63	1	8	New comment	2025-05-13 14:18:31.71704
64	1	8	New comment	2025-05-13 14:25:22.900714
65	1	8	New comment	2025-05-13 14:26:42.069088
66	1	8	New comment	2025-05-13 14:49:42.740167
67	1	8	New comment	2025-05-13 14:52:50.896924
68	1	8	New comment	2025-05-13 14:55:43.623091
69	1	8	New comment	2025-05-13 14:56:49.983315
70	1	8	New comment	2025-05-13 15:05:51.581397
71	1	8	New comment	2025-05-13 15:12:37.785057
72	1	8	New comment	2025-05-13 15:19:32.340665
73	1	8	New comment	2025-05-13 15:26:15.69266
74	1	8	New comment	2025-05-13 15:27:30.921267
75	1	8	New comment	2025-05-13 15:28:34.308824
76	1	8	New comment	2025-05-13 15:29:01.024941
77	1	8	New comment	2025-05-13 16:59:57.359093
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Course" ("ID", "Author_id", "Title", "Description", "Created_at", average_rating) FROM stdin;
2	3	Photoshop	you	2025-03-09 17:45:49.33255	0
3	8	3D Maya	testik na sozdanie	2025-03-25 16:08:22.090021	0
4	8	Photoshop Advanced	testik na sozdanie	2025-03-25 16:09:43.402182	0
10	8	Testim both changes	Testim both changes	2025-05-13 18:10:51.363196	0
1	0	Toon Boom	May be	2025-03-09 17:45:13.330013	4
\.


--
-- Data for Name: Course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Course_materials" ("ID", "Course_id", "Content_URL", "Description", "Uploaded_at", section_id) FROM stdin;
1	1	http://localhost:9000/toon-boom/test_file.mov		2025-04-01 18:12:42.479823	2
21	1	http://localhost:9000/course-materials-toon-boom/test_file_2.mov		2025-04-03 09:12:09.466256	3
\.


--
-- Data for Name: Subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subscriptions" ("User_id", "Course_id", "Subscribed_at") FROM stdin;
3	2	2025-04-05 15:29:30.679274
8	2	2025-05-05 19:51:24.971962
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" ("ID", "Nickname", "Password", "Email", "Bio", "Created_at") FROM stdin;
3	Gimbo	321	gg@gmail.ru	Giga	2025-03-09 17:44:13.451821
5	Geralt	prpr	ggg@gmail.ru		2025-03-12 09:56:00.483304
6	Geralt2222	prpr	ggg@gmail.ru		2025-03-12 11:01:18.947376
7	Geralt	prosto	g111g@gmail.ru		2025-03-12 19:49:32.603557
8	BomBom	$2a$10$yDE1SnmyHVwv7.7ZAcQQpOx/RSz6iPlne9eIE2MGmcMj39NaF3PAa	gusing@gmail.ru		2025-03-22 11:56:54.53197
0	Deleted user	null	null		2025-03-26 13:16:07.820196
9	Joni	$2a$10$HKRNNYE0tLh09vLXVnMmn.XexGmHx6Bmpm09wGq1m6HVcvPwxmU6C	joni@mail.ru		2025-04-26 12:14:53.655072
10	Joni	$2a$10$jN4bDtjAF4iByhF7NTpWo.e2g0z8BUrO7EWhKT3iF2.rHJCjkIFnS	joni@mail.ru		2025-04-26 15:08:49.059829
11	Joni	$2a$10$pzc.TSveLfPTG9lv5KHvIOugt6/JNnRuWQ9vahv9hzxDX0yU3Ocdy	joniii@mail.ru		2025-04-26 15:10:48.567699
12	Joni	$2a$10$Yu8c3zz3H/2jiQTGatVZGuQg2zZwhpiAUeJKgAJbi2m8C/coyQC5e	joniii@mail.ru		2025-04-26 15:11:11.477611
13	rili44	$2a$10$SNcGAUfm1Zokas3em9J3o.eEP92SOLz/COoqZ/r0As9lPOZEC2VYq	bobyk@mail.ru		2025-04-26 15:27:53.153377
14		$2a$10$xXno9Fuff8i7BuuDzUKUdus346xT.etKj/GvpR8GALZlDEqqrUuc6	new@mail.ru		2025-05-03 21:32:13.198344
15	Kili	$2a$10$Rt2hgfxQRjqANPcBHv1JIes3o3OLUI3wpdlYg.G5bdniIYjLrADZ6	kili@mail.ru		2025-05-03 21:40:47.343473
16	kiji	$2a$10$7eeKUjKZXTg04EhXOlOfgOC1TaDGHySmT4tcDu7pCMa9adfz/uW3C	limon@mail.ru		2025-05-05 18:06:41.578917
\.


--
-- Data for Name: User_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User_photos" (id, "User_id", "Content_url", "Uploaded_at") FROM stdin;
1	3	http://localhost:9000/user-photos-gimbo/test_photo.jpg	2025-04-03 09:50:17.625544
2	3	http://localhost:9000/user-photos-gimbo/test_photo%281%29.jpg	2025-04-03 09:50:29.992371
3	3	http://localhost:9000/user-photos-gimbo/test_photo(2).jpg	2025-04-03 09:53:40.82359
36	8	http://localhost:9000/user-photos-bombom/test_photo.jpg	2025-04-04 08:09:41.363539
40	8	http://localhost:9000/user-photos-bombom/test_photo(1).jpg	2025-05-11 18:52:26.929841
\.


--
-- Data for Name: course_rating; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_rating (id, course_id, user_id, rating, created_at) FROM stdin;
2	1	6	4	2025-05-14 21:35:22.171216
3	1	7	3	2025-05-14 21:35:43.987311
1	1	8	5	2025-05-14 21:34:37.99306
\.


--
-- Data for Name: course_task; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_task (id, course_id, section_id, content_url, description, created_at) FROM stdin;
2	1	2	http://localhost:9000/course-materials-toon-boom/test_photo.jpg	nechto	2025-05-22 15:10:15.797589
\.


--
-- Data for Name: section; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.section (id, course_id, title, description) FROM stdin;
3	1	module 3	testim modules
2	1	module	testim test
\.


--
-- Data for Name: task_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_reviews (id, answer_id, grade, author_comment, uploaded_at) FROM stdin;
3	3	4	Molodec	2025-05-26 11:03:00.337637
\.


--
-- Data for Name: user_answer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_answer (id, task_id, user_id, content_url, created_at) FROM stdin;
3	2	8	http://localhost:9000/course-materials-toon-boom/test_photo(1).jpg	2025-05-22 17:02:18.097701
\.


--
-- Name: Comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Comments_id_seq"', 77, true);


--
-- Name: Course_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Course_ID_seq"', 12, true);


--
-- Name: Course_materials_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Course_materials_ID_seq"', 33, true);


--
-- Name: Subscriptions_Course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Subscriptions_Course_id_seq"', 1, false);


--
-- Name: User_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_ID_seq"', 18, true);


--
-- Name: course_rating_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_rating_id_seq', 8, true);


--
-- Name: course_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_task_id_seq', 2, true);


--
-- Name: section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.section_id_seq', 3, true);


--
-- Name: task_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_reviews_id_seq', 3, true);


--
-- Name: user_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_answer_id_seq', 4, true);


--
-- Name: user_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_photos_id_seq', 41, true);


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

