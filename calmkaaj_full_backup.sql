--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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

--
-- Name: billing_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.billing_type AS ENUM (
    'personal',
    'organization'
);


ALTER TYPE public.billing_type OWNER TO neondb_owner;

--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.booking_status AS ENUM (
    'confirmed',
    'cancelled',
    'completed'
);


ALTER TYPE public.booking_status OWNER TO neondb_owner;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'accepted',
    'preparing',
    'ready',
    'delivered',
    'cancelled'
);


ALTER TYPE public.order_status OWNER TO neondb_owner;

--
-- Name: site; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.site AS ENUM (
    'blue_area',
    'i_10',
    'both'
);


ALTER TYPE public.site OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'member_individual',
    'member_organization',
    'member_organization_admin',
    'cafe_manager',
    'calmkaaj_team',
    'calmkaaj_admin'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.announcements OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: cafe_order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cafe_order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    menu_item_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.cafe_order_items OWNER TO neondb_owner;

--
-- Name: cafe_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cafe_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cafe_order_items_id_seq OWNER TO neondb_owner;

--
-- Name: cafe_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cafe_order_items_id_seq OWNED BY public.cafe_order_items.id;


--
-- Name: cafe_orders; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.cafe_orders OWNER TO neondb_owner;

--
-- Name: cafe_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cafe_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cafe_orders_id_seq OWNER TO neondb_owner;

--
-- Name: cafe_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cafe_orders_id_seq OWNED BY public.cafe_orders.id;


--
-- Name: meeting_bookings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.meeting_bookings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    room_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    status public.booking_status DEFAULT 'confirmed'::public.booking_status,
    billed_to public.billing_type DEFAULT 'personal'::public.billing_type,
    org_id uuid,
    notes text,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    credits_used numeric(10,2) NOT NULL
);


ALTER TABLE public.meeting_bookings OWNER TO neondb_owner;

--
-- Name: meeting_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.meeting_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meeting_bookings_id_seq OWNER TO neondb_owner;

--
-- Name: meeting_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.meeting_bookings_id_seq OWNED BY public.meeting_bookings.id;


--
-- Name: meeting_rooms; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.meeting_rooms OWNER TO neondb_owner;

--
-- Name: meeting_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.meeting_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meeting_rooms_id_seq OWNER TO neondb_owner;

--
-- Name: meeting_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.meeting_rooms_id_seq OWNED BY public.meeting_rooms.id;


--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.menu_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    site public.site DEFAULT 'blue_area'::public.site NOT NULL
);


ALTER TABLE public.menu_categories OWNER TO neondb_owner;

--
-- Name: menu_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.menu_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_categories_id_seq OWNER TO neondb_owner;

--
-- Name: menu_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.menu_categories_id_seq OWNED BY public.menu_categories.id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.menu_items OWNER TO neondb_owner;

--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO neondb_owner;

--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.organizations OWNER TO neondb_owner;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
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
    used_credits numeric(10,2) DEFAULT 0,
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
    email_visible boolean DEFAULT false,
    onboarding_completed boolean DEFAULT false,
    rfid_number text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: cafe_order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_order_items ALTER COLUMN id SET DEFAULT nextval('public.cafe_order_items_id_seq'::regclass);


--
-- Name: cafe_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders ALTER COLUMN id SET DEFAULT nextval('public.cafe_orders_id_seq'::regclass);


--
-- Name: meeting_bookings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_bookings ALTER COLUMN id SET DEFAULT nextval('public.meeting_bookings_id_seq'::regclass);


--
-- Name: meeting_rooms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_rooms ALTER COLUMN id SET DEFAULT nextval('public.meeting_rooms_id_seq'::regclass);


--
-- Name: menu_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_categories ALTER COLUMN id SET DEFAULT nextval('public.menu_categories_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: cafe_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cafe_order_items (id, order_id, menu_item_id, quantity, price) FROM stdin;
110	54	6	6	200.00
112	56	40	1	60.00
113	56	36	1	60.00
114	57	6	2	200.00
115	58	40	6	60.00
116	59	6	1	200.00
117	60	6	12	200.00
119	62	29	6	40.00
122	65	40	5	60.00
123	66	6	5	200.00
124	67	30	5	60.00
126	69	40	4	60.00
128	71	6	5	200.00
129	72	30	4	60.00
130	73	31	1	60.00
131	74	29	4	40.00
134	77	31	1	60.00
135	78	31	1	60.00
136	79	40	1	60.00
138	80	6	4	200.00
139	81	31	1	60.00
140	82	31	1	60.00
142	86	31	2	60.00
143	87	40	1	60.00
145	88	31	4	60.00
147	90	6	1	200.00
148	91	10	3	150.00
150	93	31	1	60.00
151	94	31	1	60.00
152	95	31	1	60.00
154	97	10	1	150.00
155	98	31	1	60.00
156	99	10	8	150.00
157	100	31	1	60.00
158	101	31	3	60.00
159	102	31	1	60.00
160	103	31	1	60.00
162	104	6	3	200.00
164	106	31	1	60.00
165	107	40	3	60.00
166	108	31	1	60.00
168	110	31	1	60.00
169	111	29	1	40.00
76	32	6	1	200.00
79	34	6	40	200.00
81	36	6	18	200.00
82	37	6	1	200.00
99	46	6	1	200.00
171	113	30	1	60.00
172	114	31	1	60.00
173	115	31	1	60.00
175	117	30	1	60.00
176	118	31	1	60.00
177	119	31	1	60.00
179	121	30	7	60.00
180	122	40	3	60.00
182	124	6	6	200.00
184	126	29	4	40.00
186	128	6	2	200.00
187	129	40	2	60.00
189	131	40	2	60.00
190	132	6	1	200.00
193	133	40	1	60.00
194	134	6	4	200.00
196	136	30	1	60.00
198	136	29	1	40.00
199	136	32	1	60.00
200	137	40	1	60.00
201	138	40	1	60.00
202	138	6	1	200.00
203	139	6	1	200.00
205	140	30	1	60.00
206	141	30	1	60.00
207	142	29	1	40.00
208	143	32	1	60.00
210	145	40	1	60.00
211	146	6	2	200.00
214	149	40	1	60.00
215	150	6	5	200.00
\.


--
-- Data for Name: cafe_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cafe_orders (id, user_id, total_amount, status, billed_to, org_id, handled_by, notes, site, created_at, updated_at, delivery_location, created_by, payment_status, payment_updated_by, payment_updated_at) FROM stdin;
68	41	840.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:41:00.184686	2025-08-05 14:41:00.184686	\N	\N	unpaid	\N	\N
69	41	240.00	pending	personal	\N	\N	\N	blue_area	2025-08-06 22:42:11.864305	2025-08-06 22:42:11.864305	\N	\N	unpaid	\N	\N
70	41	1120.00	pending	personal	\N	\N	\N	blue_area	2025-08-06 23:40:22.085763	2025-08-06 23:40:22.085763	\N	\N	unpaid	\N	\N
71	41	1000.00	pending	personal	\N	\N	\N	blue_area	2025-08-06 23:48:16.606562	2025-08-06 23:48:16.606562	\N	\N	unpaid	\N	\N
72	41	240.00	pending	personal	\N	\N	\N	blue_area	2025-08-06 23:48:46.767019	2025-08-06 23:48:46.767019	\N	\N	unpaid	\N	\N
8	1	12.50	pending	personal	\N	\N	\N	blue_area	2025-07-05 18:22:54.367693	2025-07-05 18:32:54.367693	\N	\N	unpaid	\N	\N
73	42	60.00	pending	personal	\N	\N	🧪 TESTING REAL-TIME SSE ORDER NOTIFICATIONS	blue_area	2025-08-06 23:57:56.109998	2025-08-06 23:57:56.109998	\N	\N	unpaid	\N	\N
74	41	160.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 06:39:02.189131	2025-08-07 06:39:02.189131	\N	\N	unpaid	\N	\N
46	41	200.00	delivered	personal	\N	2	Plis no sugar\n	blue_area	2025-07-16 18:41:22.704151	2025-07-16 18:49:25.082	\N	\N	paid	2	2025-07-16 18:49:25.082
47	42	1800.00	pending	personal	\N	\N		blue_area	2025-07-16 18:50:56.621199	2025-07-16 18:50:56.621199	C5	2	unpaid	\N	\N
75	41	80.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 06:40:04.945051	2025-08-07 06:40:04.945051	\N	\N	unpaid	\N	\N
76	41	1680.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 06:55:48.004108	2025-08-07 06:55:48.004108	\N	\N	unpaid	\N	\N
77	42	60.00	pending	personal	\N	\N	🧪 TEST REAL-TIME NOTIFICATION - Should appear instantly on manager dashboard	blue_area	2025-08-07 06:58:55.2058	2025-08-07 06:58:55.2058	\N	\N	unpaid	\N	\N
78	42	60.00	pending	personal	\N	\N	🚀 TESTING WITH MANAGER CONNECTED FIRST	blue_area	2025-08-07 06:59:15.33971	2025-08-07 06:59:15.33971	\N	\N	unpaid	\N	\N
79	41	610.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 07:00:41.682699	2025-08-07 07:00:41.682699	\N	\N	unpaid	\N	\N
15	1	4.50	delivered	personal	\N	2	\N	blue_area	2025-07-05 20:16:16.524385	2025-07-05 21:54:18.486	\N	\N	unpaid	\N	\N
40	41	250.00	accepted	personal	\N	2	\N	blue_area	2025-07-10 18:03:33.866108	2025-07-17 05:04:48.672	\N	\N	paid	2	2025-07-17 05:04:48.672
44	40	430.00	pending	personal	\N	\N	\N	blue_area	2025-07-16 10:56:28.327465	2025-07-17 05:05:42.857	\N	\N	paid	2	2025-07-17 05:05:42.857
80	41	800.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:19:17.086171	2025-08-07 14:19:17.086171	\N	\N	unpaid	\N	\N
81	42	60.00	pending	personal	\N	\N	🧪 DEBUGGING REAL-TIME WITH ENHANCED LOGGING	blue_area	2025-08-07 14:21:44.186354	2025-08-07 14:21:44.186354	\N	\N	unpaid	\N	\N
82	42	60.00	pending	personal	\N	\N	🚀 TEST WITH ENHANCED FRONTEND LOGGING	blue_area	2025-08-07 14:22:09.221932	2025-08-07 14:22:09.221932	\N	\N	unpaid	\N	\N
83	41	280.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:24:45.531884	2025-08-07 14:24:45.531884	\N	\N	unpaid	\N	\N
84	47	150.00	pending	personal	\N	\N	\N	i_10	2025-08-07 14:30:59.613667	2025-08-07 14:30:59.613667	\N	\N	unpaid	\N	\N
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
85	47	250.00	delivered	personal	\N	\N	\N	i_10	2025-08-07 13:30:59.613667	2025-08-07 14:30:59.613667	\N	\N	unpaid	\N	\N
86	47	120.00	pending	personal	\N	\N	🏢 TEST ORDER FROM I-10 LOCATION	i_10	2025-08-07 14:31:37.609189	2025-08-07 14:31:37.609189	\N	\N	unpaid	\N	\N
9	2	18.75	delivered	personal	\N	2	\N	blue_area	2025-07-05 18:17:54.367693	2025-07-10 08:31:49.166	\N	\N	unpaid	2	2025-07-10 08:31:49.166
36	41	3600.00	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:38:12.811523	2025-07-10 08:38:12.811523	\N	\N	unpaid	\N	\N
37	41	200.00	accepted	personal	\N	2	\N	blue_area	2025-07-10 08:40:40.215335	2025-07-10 08:42:17.776	\N	\N	unpaid	\N	\N
38	41	250.00	pending	personal	\N	\N	\N	blue_area	2025-07-10 08:46:29.650123	2025-07-10 08:46:29.650123	\N	\N	unpaid	\N	\N
87	41	610.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:36:40.120766	2025-08-07 14:36:40.120766	\N	\N	unpaid	\N	\N
88	47	240.00	pending	personal	\N	\N	\N	i_10	2025-08-07 14:43:18.493877	2025-08-07 14:43:18.493877	\N	\N	unpaid	\N	\N
54	41	1200.00	delivered	personal	\N	2	\N	blue_area	2025-07-20 11:22:23.870088	2025-07-20 11:25:56.21	\N	\N	paid	2	2025-07-20 11:25:56.21
55	41	4.50	pending	personal	\N	\N	\N	blue_area	2025-08-05 11:43:47.283431	2025-08-05 11:43:47.283431	\N	\N	unpaid	\N	\N
39	41	70000.00	pending	personal	\N	\N	CHOCOLAAAAAAAAAAAAAAAAAAAAAAAATE	blue_area	2025-07-10 08:47:33.268528	2025-07-10 08:47:33.268528	\N	\N	unpaid	\N	\N
89	41	280.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:43:52.387308	2025-08-07 14:43:52.387308	\N	\N	unpaid	\N	\N
1	2	4.50	accepted	personal	\N	2		blue_area	2025-07-05 16:40:31.946501	2025-07-08 21:52:03.51	\N	\N	paid	2	2025-07-08 21:52:03.51
56	41	120.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 13:39:26.955687	2025-08-05 13:39:26.955687	\N	\N	unpaid	\N	\N
58	41	360.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:07:03.240731	2025-08-05 14:07:03.240731	\N	\N	unpaid	\N	\N
41	1	60.00	preparing	personal	\N	2	\N	blue_area	2025-07-11 10:23:05.674091	2025-07-11 10:24:05.217	\N	\N	paid	2	2025-07-11 10:24:05.217
42	1	250.00	pending	personal	\N	\N	\N	blue_area	2025-07-15 05:41:32.894903	2025-07-15 05:41:32.894903	\N	\N	unpaid	\N	\N
90	41	200.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:44:22.290047	2025-08-07 14:44:22.290047	\N	\N	unpaid	\N	\N
59	41	200.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:07:11.439315	2025-08-05 14:07:11.439315	\N	\N	unpaid	\N	\N
60	41	2400.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:07:16.949627	2025-08-05 14:07:16.949627	\N	\N	unpaid	\N	\N
91	47	450.00	pending	personal	\N	\N	\N	i_10	2025-08-07 14:45:43.110409	2025-08-07 14:45:43.110409	\N	\N	unpaid	\N	\N
92	41	80.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:46:31.337596	2025-08-07 14:46:31.337596	\N	\N	unpaid	\N	\N
57	41	400.00	delivered	personal	\N	2	\N	blue_area	2025-08-05 14:02:35.973719	2025-08-05 14:07:40.345	\N	\N	unpaid	\N	\N
61	41	320.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:12:05.160359	2025-08-05 14:12:05.160359	\N	\N	unpaid	\N	\N
62	41	240.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:12:11.798688	2025-08-05 14:12:11.798688	\N	\N	unpaid	\N	\N
63	41	1650.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:12:23.307414	2025-08-05 14:12:23.307414	\N	\N	unpaid	\N	\N
43	1	250.00	delivered	personal	\N	2	nnn	blue_area	2025-07-16 06:20:39.545233	2025-07-16 06:23:22.093	\N	\N	paid	2	2025-07-16 06:23:22.093
64	41	840.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:19:20.959238	2025-08-05 14:19:20.959238	\N	\N	unpaid	\N	\N
65	41	300.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:33:52.26729	2025-08-05 14:33:52.26729	\N	\N	unpaid	\N	\N
66	41	1000.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:36:58.927552	2025-08-05 14:36:58.927552	\N	\N	unpaid	\N	\N
67	41	300.00	pending	personal	\N	\N	\N	blue_area	2025-08-05 14:37:09.981859	2025-08-05 14:37:09.981859	\N	\N	unpaid	\N	\N
93	47	60.00	pending	personal	\N	\N	\N	i_10	2025-08-07 14:46:43.910922	2025-08-07 14:46:43.910922	\N	\N	unpaid	\N	\N
45	1	2702.50	delivered	personal	\N	2	\N	blue_area	2025-07-16 15:31:43.502028	2025-07-16 15:33:54.375	\N	\N	paid	2	2025-07-16 15:33:54.375
94	42	60.00	pending	personal	\N	\N	🔬 TESTING SSE REAL-TIME WITH DEBUGGING	blue_area	2025-08-07 14:51:25.902717	2025-08-07 14:51:25.902717	\N	\N	unpaid	\N	\N
95	42	60.00	pending	personal	\N	\N	🔬 TEST ORDER WITH SSE ACTIVE	blue_area	2025-08-07 14:52:01.050162	2025-08-07 14:52:01.050162	\N	\N	unpaid	\N	\N
96	41	5500.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 14:55:27.020122	2025-08-07 14:55:27.020122	\N	\N	unpaid	\N	\N
97	47	150.00	pending	personal	\N	\N	\N	i_10	2025-08-07 15:01:19.433311	2025-08-07 15:01:19.433311	\N	\N	unpaid	\N	\N
98	47	60.00	pending	personal	\N	\N	\N	i_10	2025-08-07 15:01:25.552087	2025-08-07 15:01:25.552087	\N	\N	unpaid	\N	\N
99	47	1200.00	pending	personal	\N	\N	\N	i_10	2025-08-07 15:01:43.11634	2025-08-07 15:01:43.11634	\N	\N	unpaid	\N	\N
100	47	60.00	pending	personal	\N	\N	\N	i_10	2025-08-07 15:02:01.284846	2025-08-07 15:02:01.284846	\N	\N	unpaid	\N	\N
101	47	180.00	pending	personal	\N	\N	\N	i_10	2025-08-07 15:02:56.789758	2025-08-07 15:02:56.789758	\N	\N	unpaid	\N	\N
102	42	60.00	pending	personal	\N	\N	🎯 FINAL TEST - SSE CONNECTION SHOULD BE STABLE NOW	blue_area	2025-08-07 15:06:57.282654	2025-08-07 15:06:57.282654	\N	\N	unpaid	\N	\N
103	42	60.00	pending	personal	\N	\N	🚀 STABLE CONNECTION TEST - SHOULD WORK NOW	blue_area	2025-08-07 15:07:14.389874	2025-08-07 15:07:14.389874	\N	\N	unpaid	\N	\N
104	41	1240.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:11:43.78817	2025-08-07 15:11:43.78817	\N	\N	unpaid	\N	\N
105	41	280.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:12:12.684334	2025-08-07 15:12:12.684334	\N	\N	unpaid	\N	\N
106	42	60.00	pending	personal	\N	\N	🔍 DEBUGGING - SHOULD BROADCAST IMMEDIATELY	blue_area	2025-08-07 15:12:47.758284	2025-08-07 15:12:47.758284	\N	\N	unpaid	\N	\N
107	41	180.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:12:56.600079	2025-08-07 15:12:56.600079	\N	\N	unpaid	\N	\N
111	41	40.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 15:14:25.813865	2025-08-07 15:17:51.725	\N	\N	unpaid	\N	\N
110	42	60.00	accepted	personal	\N	2	FINAL DEBUG - BROWSER ALERT + TOAST	blue_area	2025-08-07 15:14:08.656441	2025-08-07 15:18:09.619	\N	\N	unpaid	\N	\N
114	42	60.00	pending	personal	\N	\N	TESTING ENHANCED create-on-behalf SSE BROADCAST	blue_area	2025-08-07 15:18:55.836687	2025-08-07 15:18:55.836687	\N	2	unpaid	\N	\N
108	42	60.00	delivered	personal	\N	2	🔥 ENHANCED TOAST TEST - SHOULD BE SUPER VISIBLE	blue_area	2025-08-07 15:13:16.095791	2025-08-07 15:21:12.268	\N	\N	unpaid	\N	\N
109	41	550.00	ready	personal	\N	2	\N	blue_area	2025-08-07 15:14:01.256215	2025-08-07 15:21:42.593	\N	\N	unpaid	\N	\N
112	41	320.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 15:14:50.872782	2025-08-07 15:17:31.214	\N	\N	unpaid	\N	\N
146	41	400.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:50:00.064805	2025-08-07 22:43:30.605	\N	\N	unpaid	\N	\N
113	41	60.00	ready	personal	\N	2	\N	blue_area	2025-08-07 15:15:56.10632	2025-08-07 15:18:52.872	\N	\N	unpaid	\N	\N
143	42	60.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:33:32.964116	2025-08-07 22:43:31.206	\N	\N	unpaid	\N	\N
142	42	40.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:33:29.089337	2025-08-07 22:43:32.254	\N	\N	unpaid	\N	\N
141	42	60.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:33:24.904679	2025-08-07 22:43:33.517	\N	\N	unpaid	\N	\N
115	42	60.00	delivered	personal	\N	2	FINAL SSE TEST - Should show in frontend logs	blue_area	2025-08-07 15:19:17.473308	2025-08-07 15:21:49.061	\N	2	unpaid	\N	\N
116	41	160.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 15:20:01.788942	2025-08-07 15:21:52.683	\N	\N	unpaid	\N	\N
117	41	60.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:29:25.95726	2025-08-07 15:29:25.95726	\N	\N	unpaid	\N	\N
118	41	60.00	pending	personal	\N	\N	TEST - NO SITE DATA LIKE FRONTEND	blue_area	2025-08-07 15:32:04.014555	2025-08-07 15:32:04.014555	\N	\N	unpaid	\N	\N
119	41	60.00	pending	personal	\N	\N	CRITICAL TEST - WATCH SSE LOGS CLOSELY	blue_area	2025-08-07 15:32:24.080956	2025-08-07 15:32:24.080956	\N	\N	unpaid	\N	\N
120	41	240.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:33:48.998131	2025-08-07 15:33:48.998131	\N	\N	unpaid	\N	\N
121	41	420.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:37:22.018746	2025-08-07 15:37:22.018746	\N	\N	unpaid	\N	\N
122	41	180.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:43:04.859131	2025-08-07 15:43:04.859131	\N	\N	unpaid	\N	\N
123	41	280.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:46:00.629602	2025-08-07 15:46:00.629602	\N	\N	unpaid	\N	\N
124	41	1200.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:46:56.606497	2025-08-07 15:46:56.606497	\N	\N	unpaid	\N	\N
125	41	550.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 15:48:25.649198	2025-08-07 15:48:25.649198	\N	\N	unpaid	\N	\N
126	41	160.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:36:18.228159	2025-08-07 18:36:18.228159	\N	\N	unpaid	\N	\N
127	41	240.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:37:04.460083	2025-08-07 18:37:04.460083	\N	\N	unpaid	\N	\N
128	41	400.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:41:53.342735	2025-08-07 18:41:53.342735	\N	\N	unpaid	\N	\N
129	41	120.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:46:11.360678	2025-08-07 18:46:11.360678	\N	\N	unpaid	\N	\N
130	41	280.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:52:05.597846	2025-08-07 18:52:05.597846	\N	\N	unpaid	\N	\N
131	41	120.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:53:56.777521	2025-08-07 18:53:56.777521	\N	\N	unpaid	\N	\N
132	41	830.00	pending	personal	\N	\N	\N	blue_area	2025-08-07 18:57:15.053528	2025-08-07 18:57:15.053528	\N	\N	unpaid	\N	\N
140	42	140.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:32:17.145974	2025-08-07 22:43:34.044	\N	\N	unpaid	\N	\N
139	42	200.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:31:12.772244	2025-08-07 22:43:35.09	\N	\N	unpaid	\N	\N
135	41	550.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:08:13.300038	2025-08-07 22:43:38.516	\N	\N	unpaid	\N	\N
137	41	60.00	ready	personal	\N	2	\N	blue_area	2025-08-07 19:15:27.046044	2025-08-07 19:21:42.972	\N	\N	unpaid	\N	\N
133	41	60.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:07:53.493689	2025-08-07 22:43:40.558	\N	\N	unpaid	\N	\N
147	41	550.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:50:55.073215	2025-08-07 22:44:06.618	\N	\N	unpaid	\N	\N
138	41	260.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:26:15.542469	2025-08-07 22:44:09.946	\N	\N	unpaid	\N	\N
145	42	60.00	delivered	personal	\N	2	\N	blue_area	2025-08-07 19:33:44.548052	2025-08-07 19:34:57.502	\N	\N	unpaid	\N	\N
136	41	240.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:08:36.105158	2025-08-07 22:44:13.298	\N	\N	unpaid	\N	\N
144	42	80.00	preparing	personal	\N	2	\N	blue_area	2025-08-07 19:33:35.733089	2025-08-07 19:37:49.96	\N	\N	unpaid	\N	\N
134	41	800.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 19:08:04.876384	2025-08-07 22:44:16.858	\N	\N	unpaid	\N	\N
150	41	1000.00	accepted	personal	\N	2	\N	blue_area	2025-08-07 22:30:15.142604	2025-08-07 22:40:56.625	Conference Room B	\N	unpaid	\N	\N
148	41	160.00	preparing	personal	\N	2	\N	blue_area	2025-08-07 20:37:16.978271	2025-08-07 22:44:23.377	\N	\N	unpaid	\N	\N
149	41	60.00	ready	personal	\N	2	\N	blue_area	2025-08-07 22:24:55.163306	2025-08-07 22:44:24.163	\N	\N	unpaid	\N	\N
\.


--
-- Data for Name: meeting_bookings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.meeting_bookings (id, user_id, room_id, start_time, end_time, status, billed_to, org_id, notes, site, created_at, updated_at, credits_used) FROM stdin;
1	2	1	2025-07-16 18:40:00	2025-07-16 20:40:00	confirmed	personal	\N		blue_area	2025-07-05 16:40:56.961518	2025-07-05 16:40:56.961518	2.00
38	40	3	2025-07-21 05:00:00	2025-07-21 06:00:00	confirmed	personal	\N	\N	blue_area	2025-07-16 08:02:26.571943	2025-07-16 08:02:26.571943	1.00
39	40	1	2025-07-19 04:00:00	2025-07-19 05:00:00	confirmed	personal	\N	\N	blue_area	2025-07-16 08:06:49.524561	2025-07-16 08:06:49.524561	1.00
43	41	3	2025-07-22 14:00:00	2025-07-22 15:00:00	confirmed	personal	\N	\N	blue_area	2025-07-20 11:23:15.836718	2025-07-20 11:23:15.836718	1.00
45	41	3	2025-08-05 10:13:00	2025-08-05 12:13:00	confirmed	organization	\N		blue_area	2025-08-05 09:13:35.144239	2025-08-05 09:13:35.144239	2.00
23	1	1	2025-07-17 09:00:00	2025-07-17 11:00:00	cancelled	personal	\N	\N	blue_area	2025-07-06 19:57:37.360321	2025-07-06 19:57:49.192	2.00
37	1	1	2025-07-16 14:00:00	2025-07-16 14:30:00	cancelled	personal	\N	\N	blue_area	2025-07-16 06:20:56.811379	2025-07-16 06:21:02.362	0.50
40	1	1	2025-07-18 20:00:00	2025-07-19 00:00:00	cancelled	personal	\N	\N	blue_area	2025-07-16 15:32:09.76543	2025-07-16 15:32:19.403	4.00
41	41	1	2025-07-17 08:30:00	2025-07-17 09:00:00	cancelled	personal	\N	\N	blue_area	2025-07-16 18:43:05.869013	2025-07-16 18:43:33.275	0.50
42	41	3	2025-07-17 12:00:00	2025-07-17 13:00:00	cancelled	personal	\N	\N	blue_area	2025-07-17 05:58:38.19904	2025-07-17 05:58:45.223	1.00
44	41	1	2025-08-05 19:00:00	2025-08-05 22:00:00	cancelled	personal	\N	\N	blue_area	2025-08-05 08:58:04.740031	2025-08-05 09:52:38.529	3.00
46	41	3	2025-08-06 11:30:00	2025-08-06 15:30:00	cancelled	personal	\N	\N	blue_area	2025-08-05 09:57:11.35019	2025-08-05 09:58:35.816	4.00
47	41	1	2025-08-06 13:00:00	2025-08-06 17:00:00	cancelled	personal	\N	\N	blue_area	2025-08-05 10:01:58.30935	2025-08-05 10:02:26.785	4.00
48	41	3	2025-08-06 13:00:00	2025-08-06 14:30:00	confirmed	personal	\N	\N	blue_area	2025-08-05 10:03:58.272996	2025-08-05 10:03:58.272996	1.50
49	41	3	2025-08-13 13:00:00	2025-08-13 16:00:00	cancelled	personal	\N	\N	blue_area	2025-08-05 10:04:05.922044	2025-08-05 10:10:19.13	3.00
50	41	3	2025-08-12 14:00:00	2025-08-12 15:30:00	confirmed	personal	\N	\N	blue_area	2025-08-05 10:27:30.029346	2025-08-05 10:27:30.029346	1.50
51	41	3	2025-08-15 11:30:00	2025-08-15 14:30:00	cancelled	personal	\N	\N	blue_area	2025-08-05 10:27:49.855458	2025-08-05 10:28:22.981	3.00
52	41	1	2025-08-07 14:30:00	2025-08-07 18:30:00	confirmed	personal	\N	\N	blue_area	2025-08-05 11:44:30.573609	2025-08-05 11:44:30.573609	20.00
53	41	3	2025-08-20 22:30:00	2025-08-21 18:30:00	cancelled	personal	\N	\N	blue_area	2025-08-07 21:15:35.691584	2025-08-07 21:16:23.107	20.00
54	41	3	2025-08-09 22:30:00	2025-08-10 17:30:00	cancelled	personal	\N	\N	blue_area	2025-08-07 21:58:04.377746	2025-08-07 21:59:04.108	19.00
55	41	3	2025-08-19 01:00:00	2025-08-19 04:00:00	cancelled	personal	\N	\N	blue_area	2025-08-07 21:58:38.247256	2025-08-07 21:59:11.446	3.00
\.


--
-- Data for Name: meeting_rooms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.meeting_rooms (id, name, description, capacity, credit_cost_per_hour, amenities, image_url, is_available, site, created_at) FROM stdin;
1	Conference Room A	Large conference room with projector	12	1	{Projector,Whiteboard,WiFi}		t	blue_area	2025-07-05 16:28:31.332347
3	Executive Suite	Premium meeting space	8	1	{Projector,Whiteboard,WiFi,"Coffee Machine"}		t	i_10	2025-07-05 16:28:31.332347
2	Meeting Room B	Small meeting room for team discussions	6	1	{Whiteboard,WiFi}		t	blue_area	2025-07-05 16:28:31.332347
4	Test Room	Test room for team access	6	1	{Projector}		t	blue_area	2025-08-05 08:06:55.238146
\.


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.menu_categories (id, name, description, display_order, is_active, site) FROM stdin;
1	Beverages	Hot and cold drinks	0	t	blue_area
2	Snacks	Light bites and snacks	0	t	blue_area
3	Meals	Full meals and lunch items	0	t	blue_area
7	Desserts	Sweet treats and desserts	4	t	blue_area
8	Coffee & Tea	Premium coffee and tea selection	1	t	i_10
9	Light Bites	Quick snacks and finger foods	2	t	i_10
10	Lunch Items	Hearty lunch options	3	t	i_10
11	Sweets	Cakes and sweet treats	4	t	i_10
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.menu_items (id, name, description, price, category_id, image_url, is_available, is_daily_special, site, created_at) FROM stdin;
47	Peach Juice	Nestle Fruita Vitals	90.00	1	https://lahorebasket.com/cdn/shop/files/nestle-fruite-vital-peach-fruit-drink-200-ml-596573.jpg?v=1737618645	t	f	both	2025-08-07 22:59:34.76598
30	Super Crisp Sweet Chili	Large sized packet	60.00	2	https://static-01.daraz.pk/p/69754a61abaa9db2144e7af9d0f95226.jpg	t	f	both	2025-08-05 11:56:39.762185
6	Lays Slated	Chips that are nice	200.00	\N	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL0ZK7PMdf3ICXdTHJSEONglKrHabpBGrzsw&s	t	f	blue_area	2025-07-05 21:29:59.090594
50	Red Grapes Juice	Nestle Fruita Vitals	90.00	1	https://nazarjanssupermarket.com/cdn/shop/files/nestle-fruita-vitals-red-grapes-200ml-nazar-jan-s-supermarket-1.png?v=1715280876	t	f	both	2025-08-07 23:08:26.229157
51	Guava Juice	Nestle Fruita Vitals	90.00	1	https://m.media-amazon.com/images/I/41iT29b-2zL.jpg_BO30,255,255,255_UF900,850_SR1910,1000,0,C_QL100_.jpg	t	f	both	2025-08-07 23:08:57.130286
64	Catty Chins 	Medium sized packet	40.00	2	https://lahorebasket.com/cdn/shop/files/super-crisp-catty-chins-30-gm-751455.jpg?v=1737619792	t	f	blue_area	2025-08-11 10:58:49.374246
52	Red Bull	Gives you wings :)	520.00	1	https://images-cdn.ubuy.co.in/67c0aef4c5f1f03d133ea8fb-red-bull-energy-drink-114mg-caffeine.jpg	t	f	both	2025-08-07 23:09:48.048064
10	Green Tea	Organic green tea	150.00	1		t	f	i_10	2025-07-08 23:57:29.773072
65	Noms Nachos Cheddar 	Large sized packet	90.00	\N	https://shopnoms.com/cdn/shop/files/Screenshot2024-04-06at2.59.19AM.png?v=1712354474	t	f	blue_area	2025-08-11 10:59:37.125847
66	Noms Nachos Chilli Lemon	Large sized packet	90.00	2	https://sehatmund.com/cdn/shop/files/NOMSNACHOSCHILLILEMONCHIPS32G.webp?v=1747466407&width=950	t	f	blue_area	2025-08-11 11:00:14.199244
54	Gala Biscuit	Medium sized packet	50.00	2	https://www.continentalbiscuits.com.pk/wp-content/uploads/Gala-Pack.png	t	f	both	2025-08-07 23:12:27.55556
48	Apple Juice	Nestle Fruita Vitals	90.00	1	https://lahorebasket.com/cdn/shop/files/nestle-fruita-vitals-apple-fruit-nectar-200-ml-640193.jpg?v=1737618673	t	f	both	2025-08-07 23:07:06.312961
40	Kurkury Red Chili Jhatka	Large sized packet	60.00	2	https://images.deliveryhero.io/image/darsktores-pk/27D19F.png?height=480	t	f	blue_area	2025-08-05 12:30:40.26132
49	Orange Juice	Nestle Fruita Vitals	90.00	1	https://nazarjanssupermarket.com/cdn/shop/files/nestle-fruita-vitals-kinnow-nectar-200ml-nazar-jan-s-supermarket-1_large.png?v=1715280865	t	f	both	2025-08-07 23:07:49.155579
57	Super Crisp Masala	Medium sized packet	40.00	2	https://pictures.grocerapps.com/original/grocerapp-super-crisp-masala-flavour-64c6169c71ea1.png	t	f	blue_area	2025-08-11 10:46:12.015244
29	Super Crisp Sweet Chilli	Medium sized packet	40.00	2	https://static-01.daraz.pk/p/69754a61abaa9db2144e7af9d0f95226.jpg	t	f	blue_area	2025-07-16 11:06:16.602924
32	Super Crisp BBQ	Large sized packet	60.00	2	https://www.metro-online.pk/_next/image?url=https%3A%2F%2Fmetro-b2c.s3.amazonaws.com%2FProducts%2F1730281057420.jpg&w=3840&q=75	t	f	blue_area	2025-08-05 12:03:17.59031
58	Super Crisp Cheese	Medium sized packet	40.00	2	https://images.deliveryhero.io/image/nv/Pakistan/Pandamart-Bahadurabad/8964000585931.jpg?height=480	t	f	blue_area	2025-08-11 10:47:42.682068
59	Super Crisp Salted	Medium sized packet	40.00	2	https://lahorebasket.com/cdn/shop/files/super-crisp-salted-flavor-32-gm-792999.jpg?v=1737619873	t	f	blue_area	2025-08-11 10:48:24.65665
56	Super Crisp BBQ	Medium sized packet	40.00	2	https://www.metro-online.pk/_next/image?url=https%3A%2F%2Fmetro-b2c.s3.amazonaws.com%2FProducts%2F1730281057420.jpg&w=3840&q=75	t	f	blue_area	2025-08-11 10:45:07.527578
60	Kurkury Chutney Chaska 	Large sized packet	60.00	2	https://lahorebasket.com/cdn/shop/files/kurkure-chutney-chaska-68-gm-408225.jpg?v=1737618067	t	f	blue_area	2025-08-11 10:49:53.318164
61	Kurkury Chutney Chaska 	Medium sized packet	40.00	\N	https://lahorebasket.com/cdn/shop/files/kurkure-chutney-chaska-68-gm-408225.jpg?v=1737618067	t	f	blue_area	2025-08-11 10:50:38.128286
67	Noms Nachos Pink Salt & Pepper 	Large sized packet	90.00	2	https://lahorebasket.com/cdn/shop/files/noms-nachos-thai-sweet-chilli-64-gm-617207.jpg?v=1737618858	t	f	blue_area	2025-08-11 11:00:55.371455
75	Butter Crunch Biscuit	Medium sized packet	50.00	2	https://www.dsmonline.pk/media/catalog/product/cache/e626209f6586797a49e0d0a395e17e33/i/n/inovative_biscuits_butter_crunch_6s_munch_pack.png	t	f	blue_area	2025-08-11 14:12:58.96574
31	Super Crisp BBQ	Large sized packet	60.00	2	https://www.metro-online.pk/_next/image?url=https%3A%2F%2Fmetro-b2c.s3.amazonaws.com%2FProducts%2F1730281057420.jpg&w=3840&q=75	t	f	i_10	2025-08-05 12:01:48.528506
69	Zeera Biscuit	Medium sized packet	50.00	2	https://www.continentalbiscuits.com.pk/wp-content/uploads/zeera_plus_family_pack.png	t	f	blue_area	2025-08-11 11:12:40.79059
70	Peanut Pik Biscuit	Medium sized packet	50.00	\N	https://www.ebm.com.pk/assets/images/Peanut-pik-banner-img.png	t	f	blue_area	2025-08-11 11:13:05.952185
34	Super Crisp Masala	Large sized packet	60.00	2	https://pictures.grocerapps.com/original/grocerapp-super-crisp-masala-flavour-64c6169c71ea1.png	t	f	both	2025-08-05 12:04:19.486915
39	Super Crisp Salted	Large sized packet	60.00	2	https://lahorebasket.com/cdn/shop/files/super-crisp-salted-flavor-32-gm-792999.jpg?v=1737619873	t	f	both	2025-08-05 12:27:37.638949
36	Super Crisp Cheese	Large sized packet	60.00	2	https://images.deliveryhero.io/image/nv/Pakistan/Pandamart-Bahadurabad/8964000585931.jpg?height=480	t	f	both	2025-08-05 12:27:14.304361
46	Mango Juice	Nestle Fruita Vitals	90.00	1	https://nazarjanssupermarket.com/cdn/shop/files/nestle-fruita-vitals-chaunsa-mango-200ml-nazar-jan-s-supermarket_large.png?v=1715280882	t	f	both	2025-08-07 22:59:06.416757
71	Party Pik Biscuit	Medium sized packet	50.00	2	https://www.ebm.com.pk/assets/images/Party-pik-banner-img.png	t	f	blue_area	2025-08-11 11:15:28.225458
72	Prince Biscuit	Medium sized packet	60.00	2	https://media.naheed.pk/catalog/product/cache/2f2d0cb0c5f92580479e8350be94f387/p/a/pack1014117-2.jpg	t	f	blue_area	2025-08-11 11:15:55.962896
73	Lemon Sandwich Biscuit	Medium sized packet	50.00	2	https://lahorebasket.com/cdn/shop/files/peek-freans-lemon-sandwich-biscuits-half-roll-522570.jpg?v=1737619011	t	f	blue_area	2025-08-11 11:19:26.283026
76	Day Dream Biscuit	Medium sized packet	40.00	\N	https://ucaaz.com/wp-content/uploads/2023/01/1700Wx1700H_257316_1.webp	t	f	blue_area	2025-08-11 14:13:24.735753
77	Tuc Biscuit	Medium sized packet	50.00	\N	https://www.continentalbiscuits.com.pk/wp-content/uploads/tuc_pack_img_3.png	t	f	blue_area	2025-08-11 14:14:04.340385
78	Jam Heart Biscuit	Medium sized packet	30.00	\N	http://media.naheed.pk/catalog/product/cache/2f2d0cb0c5f92580479e8350be94f387/1/2/1269753-1.jpg	t	f	blue_area	2025-08-11 14:14:35.206124
68	Candy Biscuit	Medium sized packet	50.00	2	https://www.cartpk.com/media/catalog/product/cache/ccf016c098f64509830f131aff46d4ef/c/a/candi_1_3_1.jpg	t	f	blue_area	2025-08-11 11:12:06.710168
63	Catty Chins 	Large sized packet	60.00	2	https://lahorebasket.com/cdn/shop/files/super-crisp-catty-chins-30-gm-751455.jpg?v=1737619792	t	f	blue_area	2025-08-11 10:57:34.677216
79	Super Crisp Mix Nimko Spicy 	Medium sized packet	100.00	\N	https://lahorebasket.com/cdn/shop/files/super-crisp-nimko-mix-spicy-30-gm-715532.jpg?v=1737619993	t	f	blue_area	2025-08-11 14:15:25.432863
80	Super Crisp Peanuts Salted 	Medium sized packet	110.00	\N	https://pictures.grocerapps.com/original/grocerapp-super-crisp-peanuts-salted-6544d6660b3c2.jpeg	t	f	blue_area	2025-08-11 14:15:51.64189
81	Super Crisp Mexican Chilli	Large sized packet	100.00	2	https://pictures.grocerapps.com/original/grocerapp-super-crisp-nimkomix-mexican-chilli-6177ea119432e.jpeg	t	f	blue_area	2025-08-11 14:16:27.764264
82	Fresh Up	Bubble Gum	5.00	2	https://qne.com.pk/cdn/shop/files/orgsize_4340243402.jpg?v=1711000976	t	f	blue_area	2025-08-11 14:17:04.781219
83	Eclairs 	Toffee	10.00	2	https://ziamart.pk/cdn/shop/files/eclairs_3.png?v=1748255192&width=1946	t	f	blue_area	2025-08-11 14:17:37.353713
84	Water Bottle	Nestle	80.00	1	https://static.tossdown.com/images/9de650d6-4287-44fe-83a2-552ce65f5246.webp	t	f	blue_area	2025-08-11 14:21:57.974314
85	Ice Cream 		150.00	\N	https://www.maryswholelife.com/wp-content/uploads/2024/09/Ninja-Creami-Protein-Ice-Cream-03.jpg	t	f	blue_area	2025-08-11 14:22:48.985276
86	Cold Coffee		350.00	\N	https://www.allrecipes.com/thmb/Hqro0FNdnDEwDjrEoxhMfKdWfOY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/21667-easy-iced-coffee-ddmfs-4x3-0093-7becf3932bd64ed7b594d46c02d0889f.jpg	t	f	blue_area	2025-08-11 14:23:19.620246
62	Kurkury Red Chilli Jhatka	Medium sized packet	40.00	2	https://images.deliveryhero.io/image/darsktores-pk/27D19F.png?height=480	t	f	blue_area	2025-08-11 10:51:31.021596
74	Chocolate Sandwich Biscuit	Medium sized packet	50.00	2	https://www.kkmart.pk/cdn/shop/files/0114107.png?crop=center&height=1200&v=1708617660&width=1200	t	f	blue_area	2025-08-11 11:20:43.123763
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.organizations (id, name, email, phone, address, site, created_at, start_date) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
XehaVEKbO87z4_ddsHewT1JkxJ-Oh4Fa	{"cookie":{"originalMaxAge":1814400000,"expires":"2025-09-02T18:01:27.138Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-09-02 18:01:42
VaTkDGF-DVoDi8bS7GPuMDG2F1CdZfbg	{"cookie":{"originalMaxAge":1814400000,"expires":"2025-08-31T13:27:48.925Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1},"userId":1}	2025-09-02 20:07:16
vJhzYEpSb6U-rrRzZoH_-HeOv1q3n_uK	{"cookie":{"originalMaxAge":1814400000,"expires":"2025-09-01T10:34:20.784Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":2}}	2025-09-01 14:36:45
oErNqCBElaHPjodTVSyKblpH5L5NKc2l	{"cookie":{"originalMaxAge":1814400000,"expires":"2025-09-01T15:23:14.880Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-09-01 15:23:27
A7fT4dUS62d5iccJXDUu0QRqif6zirLp	{"cookie":{"originalMaxAge":1814400000,"expires":"2025-08-28T22:29:48.021Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":41}}	2025-08-28 22:46:38
r0FH5oiyadoIGh8gAVHUkRbu5PZrnaRA	{"cookie":{"originalMaxAge":1814400000,"expires":"2025-08-31T14:01:32.818Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":41}}	2025-08-31 14:06:05
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, first_name, last_name, phone, role, organization_id, site, credits, used_credits, is_active, can_charge_cafe_to_org, can_charge_room_to_org, created_at, start_date, bio, linkedin_url, profile_image, job_title, company, community_visible, email_visible, onboarding_completed, rfid_number) FROM stdin;
44	team@calmkaaj.com	$2b$10$UWtXMWoaSeYBoLLUutjxLOwY2LppE7KBI6c3nrymN/MpSCYAp.zYm	Team	Member	\N	calmkaaj_team	\N	blue_area	30	0.00	t	f	t	2025-08-05 08:05:40.737239	2025-08-05 08:05:40.737239	\N	\N	\N	\N	\N	t	f	f	\N
45	team@ck.com	$2b$10$CZ8WhYLZhQQUQi13/5VcBO2IPxkMYLfuHAxIEZkr7NPVVA1qxH/Ry	CK	Team	\N	calmkaaj_team	\N	blue_area	10	0.00	t	f	t	2025-08-05 08:16:04.508075	2025-08-05 00:00:00	\N	\N	\N	\N	\N	t	f	f	\N
38	haider.nadeem@calmkaaj.org	$2b$10$nj76Dy/agviu7LhUlrfO9O9N1ek7I0xR/Iq9g48VS4QDUIgvlKxNm	Haider Nadeem		\N	calmkaaj_admin	\N	blue_area	10	0.00	t	f	t	2025-07-10 07:52:03.897306	2025-07-10 00:00:00	\N	https://www.linkedin.com/in/haider-nadeem-tarar-837847153/	\N	\N	\N	t	f	f	\N
39	sana.pirzada@calmkaaj.org	$2b$10$mYv44oce6B0B.3zjoZTF2ulTWPXeS/ajkmg3ehPLl6LbXwVm.H5Ga	Sana		\N	calmkaaj_admin	\N	blue_area	10	0.00	t	f	t	2025-07-10 07:52:43.112288	2025-07-10 00:00:00	\N	https://www.linkedin.com/in/sana-pirzada-81064b264/	\N	\N	\N	t	f	f	\N
37	zeb.ayaz@calmkaaj.org	$2b$10$TPQE3Gspqc6Zh0XFWlytueHLi/tByEvfgk43fAY1.4hEuAvtX99lS	Zeb Ayaz		\N	calmkaaj_admin	\N	blue_area	10	0.00	t	f	t	2025-07-10 07:50:39.418292	\N	\N	https://www.linkedin.com/in/zeb-ayaz-4199b611/	\N	Chief Executive Officer	CalmKaaj	t	f	f	\N
40	hadia.maryam@calmkaaj.org	$2b$10$X5hUZlFBrzZx0kigsXAtAuyaC13kdwVVhlsP2FDo81G4nRpsDYKTy	Hadia		\N	calmkaaj_admin	\N	blue_area	10	13.00	t	f	t	2025-07-10 07:53:05.0535	2025-07-10 00:00:00	\N	\N	\N	\N	\N	t	f	f	\N
1	admin@calmkaaj.com	$2b$10$xET24htvRc.gIF/BisGUzuX/ocPVHP.zq/1wardMaEomQbW1lwXEi	CalmKaaj	Team		calmkaaj_admin	\N	blue_area	100	0.00	t	f	t	2025-07-05 16:28:31.127274	2025-07-05 20:15:36.151981						f	f	t	\N
36	shayan.qureshi@calmkaaj.org	$2b$10$FaXdODOJzwg4YIYs8FiW4OogdiwF8qOM0Uiq3mAXjjMdSPpFnjbBW	Shayan Qureshi		\N	calmkaaj_admin	\N	blue_area	420	0.00	t	f	t	2025-07-09 12:42:11.828473	\N	Hi	https://www.linkedin.com/in/shayan-qureshi-207b17220/	https://media.licdn.com/dms/image/v2/D4D03AQGnQeD3MGoLjA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1724178091705?e=1757548800&v=beta&t=BgUwTjrVTLGfpN-SUOUKTI9V_5DEtVt51uDjBuy0pNQ	Chief Growth Officer	CalmKaaj	t	f	t	\N
41	member@xyz.com	$2b$10$Lj.5l/hSHkwm8bNk0CISGuEjYPPagWGEm1A0D16W9WRqSLQCwcILm	Member	Manver		member_individual	\N	blue_area	60	41.00	t	f	t	2025-07-10 07:54:56.290389	\N	Drfffff					f	t	t	\N
47	ck2member@xyz.com	$2b$10$mhgCjl.yzB5b3EnvLWmKnOPLVK7MIHKjL7nSJ1timpnV9lE5E0WoG	I10	User	\N	member_individual	\N	i_10	1000	0.00	t	f	t	2025-08-07 14:30:32.001319	\N	\N	\N	\N	\N	\N	t	f	t	\N
42	sameer@faazil.com	$2b$10$sWBO.qI6cYeCyWoZiwf8zOmFYEno/6VoB1P0BSpURkeK1EL/lztTi	Sameer	Shahid		member_individual	\N	blue_area	10	0.00	t	f	t	2025-07-10 08:13:51.565219	2025-07-10 00:00:00	Hey there :)	https://www.linkedin.com/in/syedsameershahid/	/uploads/profile-1752135313483-353790749.jpeg		Arteryal	t	t	t	\N
46	ck2cafe@calmkaaj.com	$2b$10$mhgCjl.yzB5b3EnvLWmKnOPLVK7MIHKjL7nSJ1timpnV9lE5E0WoG	I10	Manager	\N	cafe_manager	\N	i_10	10	0.00	t	f	t	2025-08-07 14:30:30.484952	\N	\N	\N	\N	\N	\N	t	f	t	\N
54	arhamhameed97@gmail.com	$2b$10$tem5rDqmVnO9udGyGiPJzeaQkzlA92tAYqmJ6hfqBndQVcdVhjZQG	Arham	Hameed	\N	member_individual	\N	i_10	20	0.00	t	f	t	2025-08-12 18:31:21.036004	2025-08-12 00:00:00	\N	\N	\N	\N	\N	t	f	f	\N
57	usamapuri98@gmail.com	$2b$10$shmJOY43EndYOVZmW0L2reGPsiofZBnl9lStTZNcP4vhG9DP2z/Qy	Usama	Puri	\N	member_individual	\N	i_10	10	0.00	t	f	t	2025-08-12 19:25:52.306631	2025-08-12 00:00:00	\N	\N	\N	\N	\N	t	f	f	\N
58	usama@logicode.academy	$2b$10$wkGdy1a9QGURWGcV7CiVp.JC.XgnYyDGEHfZZjWZEbxgFd49xYPSe	Sootri	Puri	\N	member_individual	\N	blue_area	10	0.00	t	f	t	2025-08-12 19:33:03.741043	2025-08-12 00:00:00	\N	\N	\N	\N	\N	t	f	f	\N
2	manager@calmkaaj.com	$2b$10$FCZriJLyUbY2nYPY.2knnOTff37eD31/YcTzj7e9oeX80dVTmRX4W	Cafe	Manager		cafe_manager	\N	blue_area	50	10.00	t	f	t	2025-07-05 16:28:31.127274	2025-07-05 20:15:36.151981						f	f	t	\N
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.announcements_id_seq', 11, true);


--
-- Name: cafe_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cafe_order_items_id_seq', 215, true);


--
-- Name: cafe_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cafe_orders_id_seq', 150, true);


--
-- Name: meeting_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.meeting_bookings_id_seq', 55, true);


--
-- Name: meeting_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.meeting_rooms_id_seq', 4, true);


--
-- Name: menu_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.menu_categories_id_seq', 11, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 86, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 58, true);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: cafe_order_items cafe_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_pkey PRIMARY KEY (id);


--
-- Name: cafe_orders cafe_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_pkey PRIMARY KEY (id);


--
-- Name: meeting_bookings meeting_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_pkey PRIMARY KEY (id);


--
-- Name: meeting_rooms meeting_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_rooms
    ADD CONSTRAINT meeting_rooms_pkey PRIMARY KEY (id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: cafe_order_items cafe_order_items_menu_item_id_menu_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: cafe_order_items cafe_order_items_order_id_cafe_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_order_id_cafe_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.cafe_orders(id);


--
-- Name: cafe_orders cafe_orders_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cafe_orders cafe_orders_handled_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_handled_by_users_id_fk FOREIGN KEY (handled_by) REFERENCES public.users(id);


--
-- Name: cafe_orders cafe_orders_org_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_org_id_organizations_id_fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: cafe_orders cafe_orders_payment_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_payment_updated_by_users_id_fk FOREIGN KEY (payment_updated_by) REFERENCES public.users(id);


--
-- Name: cafe_orders cafe_orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meeting_bookings meeting_bookings_org_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_org_id_organizations_id_fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: meeting_bookings meeting_bookings_room_id_meeting_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_room_id_meeting_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.meeting_rooms(id);


--
-- Name: meeting_bookings meeting_bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: menu_items menu_items_category_id_menu_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_menu_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.menu_categories(id);


--
-- Name: users users_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

