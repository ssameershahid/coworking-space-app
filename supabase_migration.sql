--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

-- Started on 2025-07-29 11:16:19 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.users DROP CONSTRAINT users_organization_id_organizations_id_fk;
ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_category_id_menu_categories_id_fk;
ALTER TABLE ONLY public.meeting_bookings DROP CONSTRAINT meeting_bookings_user_id_users_id_fk;
ALTER TABLE ONLY public.meeting_bookings DROP CONSTRAINT meeting_bookings_room_id_meeting_rooms_id_fk;
ALTER TABLE ONLY public.meeting_bookings DROP CONSTRAINT meeting_bookings_org_id_organizations_id_fk;
ALTER TABLE ONLY public.cafe_orders DROP CONSTRAINT cafe_orders_user_id_users_id_fk;
ALTER TABLE ONLY public.cafe_orders DROP CONSTRAINT cafe_orders_payment_updated_by_users_id_fk;
ALTER TABLE ONLY public.cafe_orders DROP CONSTRAINT cafe_orders_org_id_organizations_id_fk;
ALTER TABLE ONLY public.cafe_orders DROP CONSTRAINT cafe_orders_handled_by_users_id_fk;
ALTER TABLE ONLY public.cafe_orders DROP CONSTRAINT cafe_orders_created_by_users_id_fk;
ALTER TABLE ONLY public.cafe_order_items DROP CONSTRAINT cafe_order_items_order_id_cafe_orders_id_fk;
ALTER TABLE ONLY public.cafe_order_items DROP CONSTRAINT cafe_order_items_menu_item_id_menu_items_id_fk;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_unique;
ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_pkey;
ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_pkey;
ALTER TABLE ONLY public.menu_categories DROP CONSTRAINT menu_categories_pkey;
ALTER TABLE ONLY public.meeting_rooms DROP CONSTRAINT meeting_rooms_pkey;
ALTER TABLE ONLY public.meeting_bookings DROP CONSTRAINT meeting_bookings_pkey;
ALTER TABLE ONLY public.cafe_orders DROP CONSTRAINT cafe_orders_pkey;
ALTER TABLE ONLY public.cafe_order_items DROP CONSTRAINT cafe_order_items_pkey;
ALTER TABLE ONLY public.announcements DROP CONSTRAINT announcements_pkey;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.menu_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.menu_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.meeting_rooms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.meeting_bookings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.cafe_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.cafe_order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.announcements ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP TABLE public.organizations;
DROP SEQUENCE public.menu_items_id_seq;
DROP TABLE public.menu_items;
DROP SEQUENCE public.menu_categories_id_seq;
DROP TABLE public.menu_categories;
DROP SEQUENCE public.meeting_rooms_id_seq;
DROP TABLE public.meeting_rooms;
DROP SEQUENCE public.meeting_bookings_id_seq;
DROP TABLE public.meeting_bookings;
DROP SEQUENCE public.cafe_orders_id_seq;
DROP TABLE public.cafe_orders;
DROP SEQUENCE public.cafe_order_items_id_seq;
DROP TABLE public.cafe_order_items;
DROP SEQUENCE public.announcements_id_seq;
DROP TABLE public.announcements;
DROP TYPE public.user_role;
DROP TYPE public.site;
DROP TYPE public.order_status;
DROP TYPE public.booking_status;
DROP TYPE public.billing_type;
DROP SCHEMA public;
--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 3478 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 856 (class 1247 OID 16476)
-- Name: billing_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_type AS ENUM (
    'personal',
    'organization'
);


--
-- TOC entry 859 (class 1247 OID 16482)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'confirmed',
    'cancelled',
    'completed'
);


--
-- TOC entry 862 (class 1247 OID 16490)
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'accepted',
    'preparing',
    'ready',
    'delivered',
    'cancelled'
);


--
-- TOC entry 865 (class 1247 OID 16502)
-- Name: site; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.site AS ENUM (
    'blue_area',
    'i_10'
);


--
-- TOC entry 895 (class 1247 OID 24600)
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'member_individual',
    'member_organization',
    'member_organization_admin',
    'cafe_manager',
    'calmkaaj_admin'
);


SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16518)
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    image_url text,
    show_until timestamp without time zone,
    is_active boolean DEFAULT true,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    sites text[] DEFAULT '{blue_area}'::text[]
);


--
-- TOC entry 215 (class 1259 OID 16517)
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3479 (class 0 OID 0)
-- Dependencies: 215
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- TOC entry 218 (class 1259 OID 16530)
-- Name: cafe_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cafe_order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    menu_item_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 16529)
-- Name: cafe_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cafe_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3480 (class 0 OID 0)
-- Dependencies: 217
-- Name: cafe_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cafe_order_items_id_seq OWNED BY public.cafe_order_items.id;


--
-- TOC entry 220 (class 1259 OID 16537)
-- Name: cafe_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cafe_orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status,
    billed_to public.billing_type DEFAULT 'personal'::public.billing_type,
    org_id uuid,
    handled_by integer,
    notes text,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    delivery_location text,
    created_by integer,
    payment_status text DEFAULT 'unpaid'::text,
    payment_updated_by integer,
    payment_updated_at timestamp without time zone
);


--
-- TOC entry 219 (class 1259 OID 16536)
-- Name: cafe_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cafe_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3481 (class 0 OID 0)
-- Dependencies: 219
-- Name: cafe_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cafe_orders_id_seq OWNED BY public.cafe_orders.id;


--
-- TOC entry 222 (class 1259 OID 16551)
-- Name: meeting_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_bookings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    room_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    credits_used integer NOT NULL,
    status public.booking_status DEFAULT 'confirmed'::public.booking_status,
    billed_to public.billing_type DEFAULT 'personal'::public.billing_type,
    org_id uuid,
    notes text,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 221 (class 1259 OID 16550)
-- Name: meeting_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meeting_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3482 (class 0 OID 0)
-- Dependencies: 221
-- Name: meeting_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meeting_bookings_id_seq OWNED BY public.meeting_bookings.id;


--
-- TOC entry 224 (class 1259 OID 16565)
-- Name: meeting_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_rooms (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    capacity integer NOT NULL,
    credit_cost_per_hour integer NOT NULL,
    amenities text[],
    image_url text,
    is_available boolean DEFAULT true,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 223 (class 1259 OID 16564)
-- Name: meeting_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meeting_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3483 (class 0 OID 0)
-- Dependencies: 223
-- Name: meeting_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meeting_rooms_id_seq OWNED BY public.meeting_rooms.id;


--
-- TOC entry 226 (class 1259 OID 16577)
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 16576)
-- Name: menu_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3484 (class 0 OID 0)
-- Dependencies: 225
-- Name: menu_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_categories_id_seq OWNED BY public.menu_categories.id;


--
-- TOC entry 228 (class 1259 OID 16588)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category_id integer,
    image_url text,
    is_available boolean DEFAULT true,
    is_daily_special boolean DEFAULT false,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 227 (class 1259 OID 16587)
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3485 (class 0 OID 0)
-- Dependencies: 227
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- TOC entry 229 (class 1259 OID 16600)
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    start_date timestamp without time zone DEFAULT now()
);


--
-- TOC entry 231 (class 1259 OID 16611)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    role public.user_role NOT NULL,
    organization_id uuid,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    credits integer DEFAULT 30,
    used_credits integer DEFAULT 0,
    is_active boolean DEFAULT true,
    can_charge_cafe_to_org boolean DEFAULT false,
    can_charge_room_to_org boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    start_date timestamp without time zone DEFAULT now(),
    bio text,
    linkedin_url text,
    profile_image text,
    job_title text,
    company text,
    community_visible boolean DEFAULT true,
    email_visible boolean DEFAULT false
);


--
-- TOC entry 230 (class 1259 OID 16610)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3486 (class 0 OID 0)
-- Dependencies: 230
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3234 (class 2604 OID 16521)
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 16533)
-- Name: cafe_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items ALTER COLUMN id SET DEFAULT nextval('public.cafe_order_items_id_seq'::regclass);


--
-- TOC entry 3240 (class 2604 OID 16540)
-- Name: cafe_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders ALTER COLUMN id SET DEFAULT nextval('public.cafe_orders_id_seq'::regclass);


--
-- TOC entry 3247 (class 2604 OID 16554)
-- Name: meeting_bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings ALTER COLUMN id SET DEFAULT nextval('public.meeting_bookings_id_seq'::regclass);


--
-- TOC entry 3253 (class 2604 OID 16568)
-- Name: meeting_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rooms ALTER COLUMN id SET DEFAULT nextval('public.meeting_rooms_id_seq'::regclass);


--
-- TOC entry 3257 (class 2604 OID 16580)
-- Name: menu_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories ALTER COLUMN id SET DEFAULT nextval('public.menu_categories_id_seq'::regclass);


--
-- TOC entry 3261 (class 2604 OID 16591)
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- TOC entry 3270 (class 2604 OID 16614)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3457 (class 0 OID 16518)
-- Dependencies: 216
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, body, image_url, show_until, is_active, site, created_at, sites) FROM stdin;
1	Welcome to CalmKaaj	Welcome to your new coworking space! Enjoy our facilities and services.	\N	\N	t	blue_area	2025-07-05 16:28:31.399773	{blue_area}
5	efwe	rgf3erogfj3refg3r		2025-07-05 19:05:00	t	blue_area	2025-07-06 11:05:22.950913	{blue_area,i_10}
6	WORLD BUILDING WASSSSSSSUP	HHFFWEFEWFWEF	https://t3.ftcdn.net/jpg/02/09/65/14/360_F_209651427_Moux8Hkey15wtMbtLymbPPrdrLhm58fH.jpg	2025-07-06 11:00:00	t	blue_area	2025-07-06 11:21:37.750637	{blue_area,i_10}
7	WASSSSUP	FRIENDS	https://cdn-icons-png.flaticon.com/512/6028/6028690.png	2025-07-06 11:30:00	t	blue_area	2025-07-06 11:29:25.960594	{blue_area,i_10}
8	HELLO WORLD	FRIENDS	https://cdn-icons-png.flaticon.com/512/6028/6028690.png	2025-07-06 11:32:00	t	blue_area	2025-07-06 11:30:30.777845	{blue_area,i_10}
9	HELLO	HELLO	https://cdn-icons-png.flaticon.com/512/6028/6028690.png	2025-07-06 16:35:00	t	blue_area	2025-07-06 11:33:53.881194	{blue_area,i_10}
10	WASSSUP GANG	WADQWDWQD	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/0e/ec/2f/outdoor-sitting-area.jpg?w=600&h=400&s=1	2025-07-07 19:57:00	t	blue_area	2025-07-07 12:55:18.238077	{i_10}
\.


--
-- TOC entry 3459 (class 0 OID 16530)
-- Dependencies: 218
-- Data for Name: cafe_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cafe_order_items (id, order_id, menu_item_id, quantity, price) FROM stdin;
1	1	1	1	4.50
110	54	6	6	200.00
32	8	1	2	4.50
33	8	4	1	6.00
36	9	1	3	4.50
37	9	2	2	3.00
52	15	1	1	4.50
68	30	8	142	250.00
69	30	7	104	55000.00
70	31	7	1	55000.00
71	32	14	1	650.00
72	32	8	1	250.00
73	32	1	1	4.50
74	32	28	1	60.00
75	32	17	1	150.00
76	32	6	1	200.00
77	33	3	1	8.50
78	33	16	1	350.00
79	34	6	40	200.00
80	35	1	133	4.50
81	36	6	18	200.00
82	37	6	1	200.00
83	38	8	1	250.00
84	39	16	200	350.00
85	40	8	1	250.00
86	41	28	1	60.00
87	42	8	1	250.00
88	43	8	1	250.00
89	44	17	1	150.00
90	44	9	1	280.00
91	45	1	12	4.50
92	45	11	2	450.00
93	45	28	1	60.00
94	45	16	1	350.00
95	45	3	1	8.50
96	45	14	1	900.00
97	45	9	1	280.00
98	45	17	1	150.00
99	46	6	1	200.00
100	47	14	2	900.00
101	48	14	1	900.00
102	48	11	1	450.00
103	49	14	1	900.00
104	50	14	1	900.00
105	50	1	1	4.50
106	51	9	1	280.00
107	51	4	1	6.00
108	52	28	1	60.00
109	53	28	5	60.00
\.


--
-- TOC entry 3461 (class 0 OID 16537)
-- Dependencies: 220
-- Data for Name: cafe_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cafe_orders (id, user_id, total_amount, status, billed_to, org_id, handled_by, notes, site, created_at, updated_at, delivery_location, created_by, payment_status, payment_updated_by, payment_updated_at) FROM stdin;
8	1	12.50	pending	personal	\N	\N	\N	blue_area	2025-07-05 18:22:54.367693	2025-07-05 18:32:54.367693	\N	\N	unpaid	\N	\N
46	41	200.00	delivered	personal	\N	2	Plis no sugar\n	blue_area	2025-07-16 18:41:22.704151	2025-07-16 18:49:25.082	\N	\N	paid	2	2025-07-16 18:49:25.082
47	42	1800.00	pending	personal	\N	\N		blue_area	2025-07-16 18:50:56.621199	2025-07-16 18:50:56.621199	C5	2	unpaid	\N	\N
15	1	4.50	delivered	personal	\N	2	\N	blue_area	2025-07-05 20:16:16.524385	2025-07-05 21:54:18.486	\N	\N	unpaid	\N	\N
40	41	250.00	accepted	personal	\N	2	\N	blue_area	2025-07-10 18:03:33.866108	2025-07-17 05:04:48.672	\N	\N	paid	2	2025-07-17 05:04:48.672
44	40	430.00	pending	personal	\N	\N	\N	blue_area	2025-07-16 10:56:28.327465	2025-07-17 05:05:42.857	\N	\N	paid	2	2025-07-17 05:05:42.857
49	42	900.00	delivered	personal	\N	2		blue_area	2025-07-17 05:04:13.745023	2025-07-17 05:21:19.136	Meeting Room	2	paid	2	2025-07-17 05:21:19.136
48	41	1350.00	delivered	personal	\N	2	\N	blue_area	2025-07-17 04:58:36.487966	2025-07-17 05:23:10.098	\N	\N	paid	2	2025-07-17 05:23:10.098
50	41	904.50	pending	personal	\N	\N	\N	blue_area	2025-07-17 05:29:36.468937	2025-07-17 05:29:36.468937	\N	\N	unpaid	\N	\N
51	41	286.00	pending	personal	\N	\N	\N	blue_area	2025-07-17 05:44:31.180756	2025-07-17 05:44:31.180756	\N	\N	unpaid	\N	\N
52	41	60.00	pending	personal	\N	\N	\N	blue_area	2025-07-17 15:01:57.00558	2025-07-17 15:01:57.00558	\N	\N	unpaid	\N	\N
53	41	300.00	pending	personal	\N	\N	\N	blue_area	2025-07-17 15:02:03.789475	2025-07-17 15:02:03.789475	\N	\N	unpaid	\N	\N
31	39	55000.00	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:28:49.783474	2025-07-10 08:28:49.783474	\N	\N	unpaid	\N	\N
32	39	1314.50	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:29:08.563847	2025-07-10 08:29:08.563847	\N	\N	unpaid	\N	\N
33	39	358.50	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:30:04.921321	2025-07-10 08:30:04.921321	\N	\N	unpaid	\N	\N
30	38	5755500.00	delivered	personal	\N	2	Please send me these, I WILL NOT PAY. WHAT DO YOU DO	blue_area	2025-07-10 08:22:41.862982	2025-07-10 08:30:10.991	\N	\N	unpaid	\N	\N
34	39	8000.00	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:30:19.544829	2025-07-10 08:30:19.544829	\N	\N	unpaid	\N	\N
35	39	598.50	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:30:58.364197	2025-07-10 08:30:58.364197	\N	\N	unpaid	\N	\N
9	2	18.75	delivered	personal	\N	2	\N	blue_area	2025-07-05 18:17:54.367693	2025-07-10 08:31:49.166	\N	\N	unpaid	2	2025-07-10 08:31:49.166
36	41	3600.00	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:38:12.811523	2025-07-10 08:38:12.811523	\N	\N	unpaid	\N	\N
37	41	200.00	accepted	personal	\N	2	\N	blue_area	2025-07-10 08:40:40.215335	2025-07-10 08:42:17.776	\N	\N	unpaid	\N	\N
38	41	250.00	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:46:29.650123	2025-07-10 08:46:29.650123	\N	\N	unpaid	\N	\N
54	41	1200.00	delivered	personal	\N	2	\N	blue_area	2025-07-20 11:22:23.870088	2025-07-20 11:25:56.21	\N	\N	paid	2	2025-07-20 11:25:56.21
39	41	70000.00	pending	personal	\N	\N	CHOCOLAAAAAAAAAAAAAAAAAAAAAAAATE	blue_area	2025-07-10 08:47:33.268528	2025-07-10 08:47:33.268528	\N	\N	unpaid	\N	\N
1	2	4.50	accepted	personal	\N	2		blue_area	2025-07-05 16:40:31.946501	2025-07-08 21:52:03.51	\N	\N	paid	2	2025-07-08 21:52:03.51
41	1	60.00	preparing	personal	\N	2	\N	blue_area	2025-07-11 10:23:05.674091	2025-07-11 10:24:05.217	\N	\N	paid	2	2025-07-11 10:24:05.217
42	1	250.00	pending	personal	\N	\N	\N	blue_area	2025-07-15 05:41:32.894903	2025-07-15 05:41:32.894903	\N	\N	unpaid	\N	\N
43	1	250.00	delivered	personal	\N	2	nnn	blue_area	2025-07-16 06:20:39.545233	2025-07-16 06:23:22.093	\N	\N	paid	2	2025-07-16 06:23:22.093
45	1	2702.50	delivered	personal	\N	2	\N	blue_area	2025-07-16 15:31:43.502028	2025-07-16 15:33:54.375	\N	\N	paid	2	2025-07-16 15:33:54.375
\.


--
-- TOC entry 3463 (class 0 OID 16551)
-- Dependencies: 222
-- Data for Name: meeting_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_bookings (id, user_id, room_id, start_time, end_time, credits_used, status, billed_to, org_id, notes, site, created_at, updated_at) FROM stdin;
1	2	1	2025-07-16 18:40:00	2025-07-16 20:40:00	10	confirmed	personal	\N		blue_area	2025-07-05 16:40:56.961518	2025-07-05 16:40:56.961518
23	1	1	2025-07-17 09:00:00	2025-07-17 11:00:00	10	cancelled	personal	\N	\N	blue_area	2025-07-06 19:57:37.360321	2025-07-06 19:57:49.192
37	1	1	2025-07-16 14:00:00	2025-07-16 14:30:00	5	cancelled	personal	\N	\N	blue_area	2025-07-16 06:20:56.811379	2025-07-16 06:21:02.362
38	40	3	2025-07-21 05:00:00	2025-07-21 06:00:00	8	confirmed	personal	\N	\N	blue_area	2025-07-16 08:02:26.571943	2025-07-16 08:02:26.571943
39	40	1	2025-07-19 04:00:00	2025-07-19 05:00:00	5	confirmed	personal	\N	\N	blue_area	2025-07-16 08:06:49.524561	2025-07-16 08:06:49.524561
40	1	1	2025-07-18 20:00:00	2025-07-19 00:00:00	20	cancelled	personal	\N	\N	blue_area	2025-07-16 15:32:09.76543	2025-07-16 15:32:19.403
41	41	1	2025-07-17 08:30:00	2025-07-17 09:00:00	5	cancelled	personal	\N	\N	blue_area	2025-07-16 18:43:05.869013	2025-07-16 18:43:33.275
42	41	3	2025-07-17 12:00:00	2025-07-17 13:00:00	8	cancelled	personal	\N	\N	blue_area	2025-07-17 05:58:38.19904	2025-07-17 05:58:45.223
43	41	3	2025-07-22 14:00:00	2025-07-22 15:00:00	8	confirmed	personal	\N	\N	blue_area	2025-07-20 11:23:15.836718	2025-07-20 11:23:15.836718
\.


--
-- TOC entry 3465 (class 0 OID 16565)
-- Dependencies: 224
-- Data for Name: meeting_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_rooms (id, name, description, capacity, credit_cost_per_hour, amenities, image_url, is_available, site, created_at) FROM stdin;
2	Meeting Room B	Small meeting room for team discussions	6	3	{Whiteboard,WiFi}	\N	t	blue_area	2025-07-05 16:28:31.332347
3	Executive Suite	Premium meeting space	8	8	{Projector,Whiteboard,WiFi,"Coffee Machine"}	\N	t	i_10	2025-07-05 16:28:31.332347
1	Conference Room A	Large conference room with projector	12	5	{Projector,Whiteboard,WiFi}		t	blue_area	2025-07-05 16:28:31.332347
\.


--
-- TOC entry 3467 (class 0 OID 16577)
-- Dependencies: 226
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_categories (id, name, description, display_order, is_active, site) FROM stdin;
1	Beverages	Hot and cold drinks	0	t	blue_area
2	Snacks	Light bites and snacks	0	t	blue_area
3	Meals	Full meals and lunch items	0	t	blue_area
4	Beverages	Hot and cold drinks	1	t	blue_area
5	Snacks	Light snacks and appetizers	2	t	blue_area
6	Meals	Full meals and main dishes	3	t	blue_area
7	Desserts	Sweet treats and desserts	4	t	blue_area
8	Coffee & Tea	Premium coffee and tea selection	1	t	i_10
9	Light Bites	Quick snacks and finger foods	2	t	i_10
10	Lunch Items	Hearty lunch options	3	t	i_10
11	Sweets	Cakes and sweet treats	4	t	i_10
\.


--
-- TOC entry 3469 (class 0 OID 16588)
-- Dependencies: 228
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_items (id, name, description, price, category_id, image_url, is_available, is_daily_special, site, created_at) FROM stdin;
2	Green Tea	Organic green tea	3.00	1	\N	t	f	blue_area	2025-07-05 16:28:31.263323
4	Fruit Salad	Fresh seasonal fruit salad	6.00	2	\N	t	f	blue_area	2025-07-05 16:28:31.263323
5	Espresso	Double shot espresso	3.50	1	\N	t	f	i_10	2025-07-05 16:28:31.263323
6	Lays Slated	Chips that are nice	200.00	\N	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL0ZK7PMdf3ICXdTHJSEONglKrHabpBGrzsw&s	t	f	blue_area	2025-07-05 21:29:59.090594
1	Cappuccino	Freshly brewed cappuccino	4.50	1		t	f	blue_area	2025-07-05 16:28:31.263323
7	LATTE	FEAFEW	55000.00	\N	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/0e/ec/2f/outdoor-sitting-area.jpg?w=600&h=400&s=1	t	f	blue_area	2025-07-07 12:53:31.35627
3	Chicken Sandwich	Grilled chicken sandwich with fresh vegetables	8.50	3		t	f	blue_area	2025-07-05 16:28:31.263323
9	Latte	Smooth espresso with steamed milk	280.00	1	\N	t	f	blue_area	2025-07-08 23:57:29.773072
11	Chicken Sandwich	Grilled chicken with fresh vegetables	450.00	2	\N	t	f	blue_area	2025-07-08 23:57:29.773072
13	Samosa	Crispy vegetable samosa	80.00	2	\N	t	f	blue_area	2025-07-08 23:57:29.773072
15	Pasta	Creamy chicken alfredo pasta	550.00	3	\N	t	f	blue_area	2025-07-08 23:57:29.773072
16	Chocolate Cake	Rich chocolate cake slice	350.00	4	\N	t	f	blue_area	2025-07-08 23:57:29.773072
17	Ice Cream	Vanilla ice cream scoop	150.00	4	\N	t	f	blue_area	2025-07-08 23:57:29.773072
18	Espresso	Strong Italian espresso	200.00	5	\N	t	f	i_10	2025-07-08 23:57:34.878637
19	Chai Latte	Spiced chai with steamed milk	220.00	5	\N	t	f	i_10	2025-07-08 23:57:34.878637
20	Cold Brew	Smooth cold brew coffee	280.00	5	\N	t	f	i_10	2025-07-08 23:57:34.878637
21	Club Sandwich	Triple layer club sandwich	480.00	6	\N	t	f	i_10	2025-07-08 23:57:34.878637
22	Wrap	Chicken caesar wrap	350.00	6	\N	t	f	i_10	2025-07-08 23:57:34.878637
23	Nachos	Loaded nachos with cheese	400.00	6	\N	t	f	i_10	2025-07-08 23:57:34.878637
24	Karahi	Chicken karahi with naan	750.00	7	\N	t	f	i_10	2025-07-08 23:57:34.878637
25	Burger	Beef burger with fries	600.00	7	\N	t	f	i_10	2025-07-08 23:57:34.878637
26	Cheesecake	New York style cheesecake	380.00	8	\N	t	f	i_10	2025-07-08 23:57:34.878637
27	Brownie	Fudgy chocolate brownie	250.00	8	\N	t	f	i_10	2025-07-08 23:57:34.878637
10	Green Tea	Organic green tea	150.00	1		t	f	i_10	2025-07-08 23:57:29.773072
28	DeezNuts	Fresh nuts	60.00	\N	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8H4SZ7hwlCGMx2ANIqWnL2VNAHLwcbPEZrg&s	t	f	blue_area	2025-07-10 07:47:22.311637
12	Apple tart	Fresh seasonal fruit salad	500.00	2		t	f	i_10	2025-07-08 23:57:29.773072
29	waffles 		700.00	\N		t	f	blue_area	2025-07-16 11:06:16.602924
8	Cappuccino	Rich espresso with steamed milk	250.00	1		f	f	i_10	2025-07-08 23:57:29.773072
14	Apple tart	Sweet	500.00	2		t	f	blue_area	2025-07-08 23:57:29.773072
\.


--
-- TOC entry 3470 (class 0 OID 16600)
-- Dependencies: 229
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, email, phone, address, site, created_at, start_date) FROM stdin;
\.


--
-- TOC entry 3472 (class 0 OID 16611)
-- Dependencies: 231
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, first_name, last_name, phone, role, organization_id, site, credits, used_credits, is_active, can_charge_cafe_to_org, can_charge_room_to_org, created_at, start_date, bio, linkedin_url, profile_image, job_title, company, community_visible, email_visible) FROM stdin;
36	shayan.qureshi@calmkaaj.org	$2b$10$FaXdODOJzwg4YIYs8FiW4OogdiwF8qOM0Uiq3mAXjjMdSPpFnjbBW	Shayan Qureshi		\N	calmkaaj_admin	\N	blue_area	420	0	t	f	t	2025-07-09 12:42:11.828473	\N	Hi	https://www.linkedin.com/in/shayan-qureshi-207b17220/	https://media.licdn.com/dms/image/v2/D4D03AQGnQeD3MGoLjA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1724178091705?e=1757548800&v=beta&t=BgUwTjrVTLGfpN-SUOUKTI9V_5DEtVt51uDjBuy0pNQ	Chief Growth Officer	CalmKaaj	t	f
38	haider.nadeem@calmkaaj.org	$2b$10$nj76Dy/agviu7LhUlrfO9O9N1ek7I0xR/Iq9g48VS4QDUIgvlKxNm	Haider Nadeem		\N	calmkaaj_admin	\N	blue_area	10	0	t	f	t	2025-07-10 07:52:03.897306	2025-07-10 00:00:00	\N	https://www.linkedin.com/in/haider-nadeem-tarar-837847153/	\N	\N	\N	t	f
39	sana.pirzada@calmkaaj.org	$2b$10$mYv44oce6B0B.3zjoZTF2ulTWPXeS/ajkmg3ehPLl6LbXwVm.H5Ga	Sana		\N	calmkaaj_admin	\N	blue_area	10	0	t	f	t	2025-07-10 07:52:43.112288	2025-07-10 00:00:00	\N	https://www.linkedin.com/in/sana-pirzada-81064b264/	\N	\N	\N	t	f
2	manager@calmkaaj.com	$2b$10$JXv2QcZ8rR4T7IC6oBxEY.fwB7hstHvfGIGtt5yi4yG2/8KZslZVq	Cafe	Manager	\N	cafe_manager	\N	blue_area	50	10	t	f	t	2025-07-05 16:28:31.127274	2025-07-05 20:15:36.151981	\N	\N	\N	\N	\N	t	f
37	zeb.ayaz@calmkaaj.org	$2b$10$TPQE3Gspqc6Zh0XFWlytueHLi/tByEvfgk43fAY1.4hEuAvtX99lS	Zeb Ayaz		\N	calmkaaj_admin	\N	blue_area	10	0	t	f	t	2025-07-10 07:50:39.418292	\N	\N	https://www.linkedin.com/in/zeb-ayaz-4199b611/	\N	Chief Executive Officer	CalmKaaj	t	f
42	sameer@faazil.com	$2b$10$sWBO.qI6cYeCyWoZiwf8zOmFYEno/6VoB1P0BSpURkeK1EL/lztTi	Sameer	Shahid		member_individual	\N	blue_area	10	0	t	f	t	2025-07-10 08:13:51.565219	2025-07-10 00:00:00	Hey there :)	https://www.linkedin.com/in/syedsameershahid/	/uploads/profile-1752135313483-353790749.jpeg		Arteryal	t	t
40	hadia.maryam@calmkaaj.org	$2b$10$X5hUZlFBrzZx0kigsXAtAuyaC13kdwVVhlsP2FDo81G4nRpsDYKTy	Hadia		\N	calmkaaj_admin	\N	blue_area	10	13	t	f	t	2025-07-10 07:53:05.0535	2025-07-10 00:00:00	\N	\N	\N	\N	\N	t	f
1	admin@calmkaaj.com	$2b$10$xET24htvRc.gIF/BisGUzuX/ocPVHP.zq/1wardMaEomQbW1lwXEi	CalmKaaj	Team		calmkaaj_admin	\N	blue_area	100	0	t	f	t	2025-07-05 16:28:31.127274	2025-07-05 20:15:36.151981						f	f
41	member@xyz.com	$2b$10$Lj.5l/hSHkwm8bNk0CISGuEjYPPagWGEm1A0D16W9WRqSLQCwcILm	Member		\N	member_individual	\N	blue_area	15	8	t	f	t	2025-07-10 07:54:56.290389	2025-07-10 00:00:00	\N	\N	\N	\N	\N	t	f
\.


--
-- TOC entry 3487 (class 0 OID 0)
-- Dependencies: 215
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announcements_id_seq', 11, true);


--
-- TOC entry 3488 (class 0 OID 0)
-- Dependencies: 217
-- Name: cafe_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cafe_order_items_id_seq', 110, true);


--
-- TOC entry 3489 (class 0 OID 0)
-- Dependencies: 219
-- Name: cafe_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cafe_orders_id_seq', 54, true);


--
-- TOC entry 3490 (class 0 OID 0)
-- Dependencies: 221
-- Name: meeting_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.meeting_bookings_id_seq', 43, true);


--
-- TOC entry 3491 (class 0 OID 0)
-- Dependencies: 223
-- Name: meeting_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.meeting_rooms_id_seq', 3, true);


--
-- TOC entry 3492 (class 0 OID 0)
-- Dependencies: 225
-- Name: menu_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menu_categories_id_seq', 11, true);


--
-- TOC entry 3493 (class 0 OID 0)
-- Dependencies: 227
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 29, true);


--
-- TOC entry 3494 (class 0 OID 0)
-- Dependencies: 230
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 43, true);


--
-- TOC entry 3282 (class 2606 OID 16528)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 3284 (class 2606 OID 16535)
-- Name: cafe_order_items cafe_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3286 (class 2606 OID 16549)
-- Name: cafe_orders cafe_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3288 (class 2606 OID 16563)
-- Name: meeting_bookings meeting_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 3290 (class 2606 OID 16575)
-- Name: meeting_rooms meeting_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rooms
    ADD CONSTRAINT meeting_rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 3292 (class 2606 OID 16586)
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3294 (class 2606 OID 16599)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3296 (class 2606 OID 16609)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 3298 (class 2606 OID 16627)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3300 (class 2606 OID 16625)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3301 (class 2606 OID 16633)
-- Name: cafe_order_items cafe_order_items_menu_item_id_menu_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- TOC entry 3302 (class 2606 OID 16628)
-- Name: cafe_order_items cafe_order_items_order_id_cafe_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_order_id_cafe_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.cafe_orders(id);


--
-- TOC entry 3303 (class 2606 OID 73729)
-- Name: cafe_orders cafe_orders_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3304 (class 2606 OID 16648)
-- Name: cafe_orders cafe_orders_handled_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_handled_by_users_id_fk FOREIGN KEY (handled_by) REFERENCES public.users(id);


--
-- TOC entry 3305 (class 2606 OID 16643)
-- Name: cafe_orders cafe_orders_org_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_org_id_organizations_id_fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- TOC entry 3306 (class 2606 OID 73734)
-- Name: cafe_orders cafe_orders_payment_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_payment_updated_by_users_id_fk FOREIGN KEY (payment_updated_by) REFERENCES public.users(id);


--
-- TOC entry 3307 (class 2606 OID 16638)
-- Name: cafe_orders cafe_orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3308 (class 2606 OID 16663)
-- Name: meeting_bookings meeting_bookings_org_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_org_id_organizations_id_fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- TOC entry 3309 (class 2606 OID 16658)
-- Name: meeting_bookings meeting_bookings_room_id_meeting_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_room_id_meeting_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.meeting_rooms(id);


--
-- TOC entry 3310 (class 2606 OID 16653)
-- Name: meeting_bookings meeting_bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3311 (class 2606 OID 16668)
-- Name: menu_items menu_items_category_id_menu_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_menu_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.menu_categories(id);


--
-- TOC entry 3312 (class 2606 OID 16673)
-- Name: users users_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


-- Completed on 2025-07-29 11:16:26 UTC

--
-- PostgreSQL database dump complete
--

