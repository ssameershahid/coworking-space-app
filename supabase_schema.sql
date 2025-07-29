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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: billing_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_type AS ENUM (
    'personal',
    'organization'
);


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'confirmed',
    'cancelled',
    'completed'
);


--
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
-- Name: site; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.site AS ENUM (
    'blue_area',
    'i_10'
);


--
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
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
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
-- Name: cafe_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cafe_order_items_id_seq OWNED BY public.cafe_order_items.id;


--
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
-- Name: cafe_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cafe_orders_id_seq OWNED BY public.cafe_orders.id;


--
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
-- Name: meeting_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meeting_bookings_id_seq OWNED BY public.meeting_bookings.id;


--
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
-- Name: meeting_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meeting_rooms_id_seq OWNED BY public.meeting_rooms.id;


--
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
-- Name: menu_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_categories_id_seq OWNED BY public.menu_categories.id;


--
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
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
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
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: cafe_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items ALTER COLUMN id SET DEFAULT nextval('public.cafe_order_items_id_seq'::regclass);


--
-- Name: cafe_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders ALTER COLUMN id SET DEFAULT nextval('public.cafe_orders_id_seq'::regclass);


--
-- Name: meeting_bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings ALTER COLUMN id SET DEFAULT nextval('public.meeting_bookings_id_seq'::regclass);


--
-- Name: meeting_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rooms ALTER COLUMN id SET DEFAULT nextval('public.meeting_rooms_id_seq'::regclass);


--
-- Name: menu_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories ALTER COLUMN id SET DEFAULT nextval('public.menu_categories_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: cafe_order_items cafe_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_pkey PRIMARY KEY (id);


--
-- Name: cafe_orders cafe_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_pkey PRIMARY KEY (id);


--
-- Name: meeting_bookings meeting_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_pkey PRIMARY KEY (id);


--
-- Name: meeting_rooms meeting_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rooms
    ADD CONSTRAINT meeting_rooms_pkey PRIMARY KEY (id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cafe_order_items cafe_order_items_menu_item_id_menu_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: cafe_order_items cafe_order_items_order_id_cafe_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_order_items
    ADD CONSTRAINT cafe_order_items_order_id_cafe_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.cafe_orders(id);


--
-- Name: cafe_orders cafe_orders_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cafe_orders cafe_orders_handled_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_handled_by_users_id_fk FOREIGN KEY (handled_by) REFERENCES public.users(id);


--
-- Name: cafe_orders cafe_orders_org_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_org_id_organizations_id_fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: cafe_orders cafe_orders_payment_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_payment_updated_by_users_id_fk FOREIGN KEY (payment_updated_by) REFERENCES public.users(id);


--
-- Name: cafe_orders cafe_orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_orders
    ADD CONSTRAINT cafe_orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meeting_bookings meeting_bookings_org_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_org_id_organizations_id_fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: meeting_bookings meeting_bookings_room_id_meeting_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_room_id_meeting_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.meeting_rooms(id);


--
-- Name: meeting_bookings meeting_bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_bookings
    ADD CONSTRAINT meeting_bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: menu_items menu_items_category_id_menu_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_menu_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.menu_categories(id);


--
-- Name: users users_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- PostgreSQL database dump complete
--

