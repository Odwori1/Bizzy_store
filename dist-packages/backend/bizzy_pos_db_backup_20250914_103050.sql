--
-- PostgreSQL database dump
--

\restrict qXYm0LiiLTlu5aFelpz7c0g9ozkI3rugFQQ2gt0T2uXV2VuhHECwYiIQYNnDGIS

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: barcode_scan_events; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.barcode_scan_events (
    id integer NOT NULL,
    barcode character varying(50),
    success boolean,
    source character varying(20),
    user_id integer,
    session_id character varying(100),
    created_at timestamp without time zone
);


ALTER TABLE public.barcode_scan_events OWNER TO pos_user;

--
-- Name: barcode_scan_events_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.barcode_scan_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.barcode_scan_events_id_seq OWNER TO pos_user;

--
-- Name: barcode_scan_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.barcode_scan_events_id_seq OWNED BY public.barcode_scan_events.id;


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.businesses (
    id integer NOT NULL,
    name character varying(100),
    address character varying(200),
    phone character varying(20),
    email character varying(100),
    logo_url character varying(200),
    tax_id character varying(50),
    currency_code character varying(3),
    country character varying(100),
    country_code character varying(2)
);


ALTER TABLE public.businesses OWNER TO pos_user;

--
-- Name: businesses_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.businesses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.businesses_id_seq OWNER TO pos_user;

--
-- Name: businesses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.businesses_id_seq OWNED BY public.businesses.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(3) NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(10) NOT NULL,
    decimal_places integer,
    symbol_position character varying(20),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.currencies OWNER TO pos_user;

--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.currencies_id_seq OWNER TO pos_user;

--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    address character varying(200),
    loyalty_points integer,
    total_spent double precision,
    created_at timestamp without time zone,
    last_purchase timestamp without time zone
);


ALTER TABLE public.customers OWNER TO pos_user;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO pos_user;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    base_currency character varying(3) NOT NULL,
    target_currency character varying(3) NOT NULL,
    rate numeric(12,6) NOT NULL,
    effective_date timestamp without time zone NOT NULL,
    source character varying(50),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.exchange_rates OWNER TO pos_user;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.exchange_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exchange_rates_id_seq OWNER TO pos_user;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255),
    is_active boolean
);


ALTER TABLE public.expense_categories OWNER TO pos_user;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expense_categories_id_seq OWNER TO pos_user;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    original_amount numeric(10,2) NOT NULL,
    original_currency_code character varying(3) NOT NULL,
    exchange_rate numeric(10,6),
    description character varying(255),
    category_id integer NOT NULL,
    date timestamp without time zone NOT NULL,
    created_by integer NOT NULL,
    business_id integer NOT NULL,
    payment_method character varying(50),
    receipt_url character varying(500),
    is_recurring boolean,
    recurrence_interval character varying(50)
);


ALTER TABLE public.expenses OWNER TO pos_user;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expenses_id_seq OWNER TO pos_user;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: inventory_history; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.inventory_history (
    id integer NOT NULL,
    product_id integer,
    change_type character varying(20),
    quantity_change integer,
    previous_quantity integer,
    new_quantity integer,
    reason character varying(200),
    changed_by integer,
    changed_at timestamp without time zone
);


ALTER TABLE public.inventory_history OWNER TO pos_user;

--
-- Name: inventory_history_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.inventory_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventory_history_id_seq OWNER TO pos_user;

--
-- Name: inventory_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.inventory_history_id_seq OWNED BY public.inventory_history.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    sale_id integer,
    amount double precision,
    payment_method character varying(20),
    transaction_id character varying(100),
    status character varying(20),
    created_at timestamp without time zone
);


ALTER TABLE public.payments OWNER TO pos_user;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO pos_user;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255)
);


ALTER TABLE public.permissions OWNER TO pos_user;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permissions_id_seq OWNER TO pos_user;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(100),
    description character varying(300),
    price double precision,
    cost_price double precision,
    barcode character varying(50),
    stock_quantity integer,
    min_stock_level integer,
    last_restocked timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    original_price double precision,
    original_cost_price double precision,
    original_currency_code character varying(3),
    exchange_rate_at_creation double precision
);


ALTER TABLE public.products OWNER TO pos_user;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO pos_user;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    po_id integer,
    product_id integer,
    quantity integer,
    unit_cost double precision,
    received_quantity integer,
    notes text
);


ALTER TABLE public.purchase_order_items OWNER TO pos_user;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_order_items_id_seq OWNER TO pos_user;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    supplier_id integer,
    po_number character varying(50),
    status character varying(20),
    total_amount double precision,
    order_date timestamp without time zone,
    expected_delivery timestamp without time zone,
    received_date timestamp without time zone,
    notes text,
    created_by integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.purchase_orders OWNER TO pos_user;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_orders_id_seq OWNER TO pos_user;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: refund_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.refund_items (
    id integer NOT NULL,
    refund_id integer,
    sale_item_id integer,
    quantity integer
);


ALTER TABLE public.refund_items OWNER TO pos_user;

--
-- Name: refund_items_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.refund_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refund_items_id_seq OWNER TO pos_user;

--
-- Name: refund_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.refund_items_id_seq OWNED BY public.refund_items.id;


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.refunds (
    id integer NOT NULL,
    sale_id integer,
    user_id integer,
    reason text,
    total_amount double precision,
    original_amount double precision,
    original_currency character varying(3),
    exchange_rate_at_refund double precision,
    status character varying(20),
    created_at timestamp without time zone
);


ALTER TABLE public.refunds OWNER TO pos_user;

--
-- Name: refunds_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refunds_id_seq OWNER TO pos_user;

--
-- Name: refunds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;


--
-- Name: role_permission; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.role_permission (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permission OWNER TO pos_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    is_default boolean
);


ALTER TABLE public.roles OWNER TO pos_user;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO pos_user;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer,
    product_id integer,
    quantity integer,
    unit_price double precision,
    subtotal double precision,
    refunded_quantity integer,
    original_unit_price double precision,
    original_subtotal double precision
);


ALTER TABLE public.sale_items OWNER TO pos_user;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sale_items_id_seq OWNER TO pos_user;

--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    user_id integer,
    customer_id integer,
    total_amount double precision,
    tax_amount double precision,
    original_amount double precision,
    original_currency character varying(3),
    exchange_rate_at_sale double precision,
    usd_amount double precision,
    usd_tax_amount double precision,
    payment_status character varying(20),
    created_at timestamp without time zone
);


ALTER TABLE public.sales OWNER TO pos_user;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sales_id_seq OWNER TO pos_user;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    contact_person character varying(100),
    email character varying(100),
    phone character varying(20),
    address text,
    tax_id character varying(50),
    payment_terms character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.suppliers OWNER TO pos_user;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.suppliers_id_seq OWNER TO pos_user;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: user_role; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.user_role (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_role OWNER TO pos_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100),
    hashed_password character varying(128) NOT NULL,
    is_active boolean,
    created_at timestamp without time zone,
    reset_token character varying(100),
    reset_token_expires timestamp without time zone,
    business_id integer,
    two_factor_enabled boolean,
    two_factor_secret character varying(32),
    two_factor_backup_codes json
);


ALTER TABLE public.users OWNER TO pos_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: pos_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO pos_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pos_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: barcode_scan_events id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.barcode_scan_events ALTER COLUMN id SET DEFAULT nextval('public.barcode_scan_events_id_seq'::regclass);


--
-- Name: businesses id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.businesses ALTER COLUMN id SET DEFAULT nextval('public.businesses_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);


--
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: inventory_history id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.inventory_history ALTER COLUMN id SET DEFAULT nextval('public.inventory_history_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: refund_items id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refund_items ALTER COLUMN id SET DEFAULT nextval('public.refund_items_id_seq'::regclass);


--
-- Name: refunds id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: barcode_scan_events; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.barcode_scan_events (id, barcode, success, source, user_id, session_id, created_at) FROM stdin;
\.


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.businesses (id, name, address, phone, email, logo_url, tax_id, currency_code, country, country_code) FROM stdin;
2	Lit	Nakagere, mukono	+256757354476	litelectricals@lit.com		txtv12345	UGX	\N	\N
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.currencies (id, code, name, symbol, decimal_places, symbol_position, is_active, created_at) FROM stdin;
1	USD	US Dollar	$	2	before	t	2025-09-13 07:06:38.90121
2	UGX	Ugandan Shilling	USh	0	before	t	2025-09-13 07:06:38.90121
3	KES	Kenyan Shilling	KSh	2	before	t	2025-09-13 07:06:38.90121
4	NGN	Nigerian Naira	₦	2	before	t	2025-09-13 07:06:38.90121
5	GBP	British Pound	£	2	before	t	2025-09-13 07:06:38.90121
6	EUR	Euro	€	2	after	t	2025-09-13 07:06:38.90121
7	INR	Indian Rupee	₹	2	before	t	2025-09-13 07:06:38.90121
8	JPY	Japanese Yen	¥	0	before	t	2025-09-13 07:06:38.90121
9	CNY	Chinese Yuan	¥	2	before	t	2025-09-13 07:06:38.90121
10	BRL	Brazilian Real	R$	2	before	t	2025-09-13 07:06:38.90121
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.customers (id, name, email, phone, address, loyalty_points, total_spent, created_at, last_purchase) FROM stdin;
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.exchange_rates (id, base_currency, target_currency, rate, effective_date, source, is_active, created_at) FROM stdin;
3	USD	KES	129.169706	2025-09-13 07:58:21.830207	openexchangerates	f	2025-09-13 07:58:21.830207
4	USD	KES	129.169706	2025-09-13 07:58:23.132004	openexchangerates	f	2025-09-13 07:58:23.132004
8	USD	KES	129.169706	2025-09-13 20:43:52.649915	openexchangerates	t	2025-09-13 20:43:52.649915
9	UGX	KES	0.036760	2025-09-13 20:43:52.656707	openexchangerates	t	2025-09-13 20:43:52.656707
6	UGX	USD	0.000285	2025-09-13 14:01:38.189496	openexchangerates	f	2025-09-13 14:01:38.189496
11	UGX	USD	0.000285	2025-09-14 00:37:36.49494	openexchangerates	t	2025-09-14 00:37:36.49494
1	USD	UGX	3515.681410	2025-09-13 07:27:42.622768	openexchangerates	f	2025-09-13 07:27:42.622768
2	USD	UGX	3515.681410	2025-09-13 07:27:43.683197	openexchangerates	f	2025-09-13 07:27:43.683197
5	USD	UGX	3513.818695	2025-09-13 14:01:37.18478	openexchangerates	f	2025-09-13 14:01:37.18478
7	USD	UGX	3513.818695	2025-09-13 20:43:49.074316	openexchangerates	f	2025-09-13 20:43:49.074316
10	USD	UGX	3513.818695	2025-09-14 00:37:35.912549	openexchangerates	f	2025-09-14 00:37:35.912549
12	USD	UGX	3513.818695	2025-09-14 08:44:38.447469	openexchangerates	f	2025-09-14 08:44:38.447469
13	USD	UGX	3513.818695	2025-09-14 08:44:39.840578	openexchangerates	t	2025-09-14 08:44:39.840578
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.expense_categories (id, name, description, is_active) FROM stdin;
1	Rent	Store rental costs	t
2	Utilities	Electricity, water, internet	t
3	Salaries	Staff salaries and wages	t
4	Inventory	Product purchases and restocking	t
5	Marketing	Advertising and promotions	t
6	Maintenance	Equipment and facility maintenance	t
7	Office Supplies	Stationery and office materials	t
8	Transportation	Delivery and transportation costs	t
9	Taxes	Business taxes and fees	t
10	Miscellaneous	Other expenses	t
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.expenses (id, amount, original_amount, original_currency_code, exchange_rate, description, category_id, date, created_by, business_id, payment_method, receipt_url, is_recurring, recurrence_interval) FROM stdin;
\.


--
-- Data for Name: inventory_history; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.inventory_history (id, product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, changed_by, changed_at) FROM stdin;
1	2	sale	-1	50	49	Sale #1	2	2025-09-14 00:37:36.509113
2	2	adjustment	-1	49	48	Sale #1	2	2025-09-14 00:37:37.055691
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.payments (id, sale_id, amount, payment_method, transaction_id, status, created_at) FROM stdin;
1	1	5000	cash	\N	completed	2025-09-14 00:37:36.509113
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.permissions (id, name, description) FROM stdin;
1	sale:create	Create a new sale/transaction
2	sale:read	View sales history
3	sale:refund	Process refunds for sales
4	sale:delete	Delete sales records
5	product:create	Create new products
6	product:read	View products
7	product:update	Edit existing products
8	product:delete	Delete products
9	inventory:read	View inventory levels
10	inventory:update	Update inventory counts
11	customer:create	Create new customer profiles
12	customer:read	View customer information
13	customer:update	Edit customer information
14	customer:delete	Delete customer records
15	supplier:create	Create new suppliers
16	supplier:read	View suppliers
17	supplier:update	Edit suppliers
18	supplier:delete	Delete suppliers
19	purchase_order:create	Create purchase orders
20	purchase_order:read	View purchase orders
21	purchase_order:update	Edit purchase orders
22	purchase_order:delete	Delete purchase orders
23	purchase_order:receive	Receive purchase order items
24	user:create	Create new users
25	user:read	View users
26	user:update	Edit users
27	user:delete	Delete users
28	role:manage	Manage roles and permissions
29	business:update	Update business settings
30	report:view	View all reports
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.products (id, name, description, price, cost_price, barcode, stock_quantity, min_stock_level, last_restocked, created_at, updated_at, original_price, original_cost_price, original_currency_code, exchange_rate_at_creation) FROM stdin;
1	Soda Can	Local soda	0.85	0.4	UGX001	100	20	\N	\N	\N	3000	1400	UGX	0.000285
3	Milk 1L	Local milk	2.14	1.07	UGX003	30	5	\N	\N	\N	7500	3750	UGX	0.000285
4	Imported Chocolate	Imported chocolate	5.99	3	USD001	20	5	\N	\N	\N	5.99	3	USD	1
2	Bread Loaf	Local bread	1.42	0.71	UGX002	48	10	\N	\N	2025-09-14 00:37:37.055691	5000	2500	UGX	0.000285
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.purchase_order_items (id, po_id, product_id, quantity, unit_cost, received_quantity, notes) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.purchase_orders (id, supplier_id, po_number, status, total_amount, order_date, expected_delivery, received_date, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refund_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.refund_items (id, refund_id, sale_item_id, quantity) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.refunds (id, sale_id, user_id, reason, total_amount, original_amount, original_currency, exchange_rate_at_refund, status, created_at) FROM stdin;
\.


--
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.role_permission (role_id, permission_id) FROM stdin;
1	23
1	18
1	14
1	13
1	6
1	22
1	20
1	12
1	26
1	11
1	17
1	15
1	30
1	29
1	10
1	27
1	9
1	16
1	25
1	24
1	3
1	4
1	28
1	19
1	21
1	8
1	1
1	7
1	2
1	5
2	23
2	13
2	6
2	20
2	12
2	11
2	17
2	15
2	30
2	10
2	9
2	16
2	3
2	21
2	19
2	7
2	1
2	5
2	2
3	1
3	12
3	11
3	6
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.roles (id, name, description, is_default) FROM stdin;
1	Owner	Has full access to all features and administrative functions	f
2	Manager	Can manage products, inventory, sales, and reports but not user permissions	f
3	Cashier	Can process sales and view basic product information	t
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, refunded_quantity, original_unit_price, original_subtotal) FROM stdin;
1	1	2	1	5000	5000	0	\N	\N
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.sales (id, user_id, customer_id, total_amount, tax_amount, original_amount, original_currency, exchange_rate_at_sale, usd_amount, usd_tax_amount, payment_status, created_at) FROM stdin;
1	2	\N	1.422953326281395	0	5000	UGX	0.000284590665256279	1.422953326281395	0	completed	2025-09-14 00:37:36.509113
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.suppliers (id, name, contact_person, email, phone, address, tax_id, payment_terms, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.user_role (user_id, role_id) FROM stdin;
2	1
3	2
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.users (id, username, email, hashed_password, is_active, created_at, reset_token, reset_token_expires, business_id, two_factor_enabled, two_factor_secret, two_factor_backup_codes) FROM stdin;
2	test_owner	test_owner@bizzy.com	$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW	t	\N	\N	\N	2	\N	\N	\N
3	test_cashier	test_cashier@bizzy.com	$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW	t	2025-09-13 07:24:30.232418	\N	\N	\N	f	\N	\N
\.


--
-- Name: barcode_scan_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.barcode_scan_events_id_seq', 1, false);


--
-- Name: businesses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.businesses_id_seq', 2, true);


--
-- Name: currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.currencies_id_seq', 10, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, false);


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.exchange_rates_id_seq', 13, true);


--
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 10, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: inventory_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.inventory_history_id_seq', 2, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.permissions_id_seq', 30, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.products_id_seq', 4, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- Name: refund_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.refund_items_id_seq', 1, false);


--
-- Name: refunds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.refunds_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 1, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.sales_id_seq', 1, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pos_user
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: barcode_scan_events pk_barcode_scan_events; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.barcode_scan_events
    ADD CONSTRAINT pk_barcode_scan_events PRIMARY KEY (id);


--
-- Name: businesses pk_businesses; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT pk_businesses PRIMARY KEY (id);


--
-- Name: currencies pk_currencies; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT pk_currencies PRIMARY KEY (id);


--
-- Name: customers pk_customers; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT pk_customers PRIMARY KEY (id);


--
-- Name: exchange_rates pk_exchange_rates; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT pk_exchange_rates PRIMARY KEY (id);


--
-- Name: expense_categories pk_expense_categories; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT pk_expense_categories PRIMARY KEY (id);


--
-- Name: expenses pk_expenses; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT pk_expenses PRIMARY KEY (id);


--
-- Name: inventory_history pk_inventory_history; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT pk_inventory_history PRIMARY KEY (id);


--
-- Name: payments pk_payments; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT pk_payments PRIMARY KEY (id);


--
-- Name: permissions pk_permissions; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT pk_permissions PRIMARY KEY (id);


--
-- Name: products pk_products; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT pk_products PRIMARY KEY (id);


--
-- Name: purchase_order_items pk_purchase_order_items; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT pk_purchase_order_items PRIMARY KEY (id);


--
-- Name: purchase_orders pk_purchase_orders; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT pk_purchase_orders PRIMARY KEY (id);


--
-- Name: refund_items pk_refund_items; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT pk_refund_items PRIMARY KEY (id);


--
-- Name: refunds pk_refunds; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT pk_refunds PRIMARY KEY (id);


--
-- Name: role_permission pk_role_permission; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT pk_role_permission PRIMARY KEY (role_id, permission_id);


--
-- Name: roles pk_roles; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT pk_roles PRIMARY KEY (id);


--
-- Name: sale_items pk_sale_items; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT pk_sale_items PRIMARY KEY (id);


--
-- Name: sales pk_sales; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT pk_sales PRIMARY KEY (id);


--
-- Name: suppliers pk_suppliers; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT pk_suppliers PRIMARY KEY (id);


--
-- Name: user_role pk_user_role; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT pk_user_role PRIMARY KEY (user_id, role_id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: currencies uq_currencies_code; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT uq_currencies_code UNIQUE (code);


--
-- Name: expense_categories uq_expense_categories_name; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT uq_expense_categories_name UNIQUE (name);


--
-- Name: products uq_products_barcode; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_barcode UNIQUE (barcode);


--
-- Name: ix_barcode_scan_events_barcode; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_barcode_scan_events_barcode ON public.barcode_scan_events USING btree (barcode);


--
-- Name: ix_barcode_scan_events_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_barcode_scan_events_id ON public.barcode_scan_events USING btree (id);


--
-- Name: ix_currencies_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_currencies_id ON public.currencies USING btree (id);


--
-- Name: ix_customers_email; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_customers_email ON public.customers USING btree (email);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_exchange_rates_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_exchange_rates_id ON public.exchange_rates USING btree (id);


--
-- Name: ix_expense_categories_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_expense_categories_id ON public.expense_categories USING btree (id);


--
-- Name: ix_expenses_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_expenses_id ON public.expenses USING btree (id);


--
-- Name: ix_inventory_history_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_inventory_history_id ON public.inventory_history USING btree (id);


--
-- Name: ix_payments_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_payments_id ON public.payments USING btree (id);


--
-- Name: ix_permissions_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_permissions_id ON public.permissions USING btree (id);


--
-- Name: ix_permissions_name; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_permissions_name ON public.permissions USING btree (name);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_products_name; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_products_name ON public.products USING btree (name);


--
-- Name: ix_purchase_order_items_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_purchase_order_items_id ON public.purchase_order_items USING btree (id);


--
-- Name: ix_purchase_orders_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_purchase_orders_id ON public.purchase_orders USING btree (id);


--
-- Name: ix_purchase_orders_po_number; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_purchase_orders_po_number ON public.purchase_orders USING btree (po_number);


--
-- Name: ix_refund_items_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_refund_items_id ON public.refund_items USING btree (id);


--
-- Name: ix_refunds_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_refunds_id ON public.refunds USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_roles_name; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_roles_name ON public.roles USING btree (name);


--
-- Name: ix_sale_items_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_sale_items_id ON public.sale_items USING btree (id);


--
-- Name: ix_sales_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_sales_id ON public.sales USING btree (id);


--
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_reset_token; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_users_reset_token ON public.users USING btree (reset_token);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: barcode_scan_events fk_barcode_scan_events_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.barcode_scan_events
    ADD CONSTRAINT fk_barcode_scan_events_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: businesses fk_businesses_currency_code_currencies; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT fk_businesses_currency_code_currencies FOREIGN KEY (currency_code) REFERENCES public.currencies(code);


--
-- Name: exchange_rates fk_exchange_rates_base_currency_currencies; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_base_currency_currencies FOREIGN KEY (base_currency) REFERENCES public.currencies(code);


--
-- Name: exchange_rates fk_exchange_rates_target_currency_currencies; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_target_currency_currencies FOREIGN KEY (target_currency) REFERENCES public.currencies(code);


--
-- Name: expenses fk_expenses_business_id_businesses; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_business_id_businesses FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: expenses fk_expenses_category_id_expense_categories; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_category_id_expense_categories FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- Name: expenses fk_expenses_created_by_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_created_by_users FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: inventory_history fk_inventory_history_changed_by_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT fk_inventory_history_changed_by_users FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: inventory_history fk_inventory_history_product_id_products; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT fk_inventory_history_product_id_products FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: payments fk_payments_sale_id_sales; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_sale_id_sales FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: purchase_order_items fk_purchase_order_items_po_id_purchase_orders; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT fk_purchase_order_items_po_id_purchase_orders FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_order_items fk_purchase_order_items_product_id_products; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT fk_purchase_order_items_product_id_products FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_orders fk_purchase_orders_created_by_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_purchase_orders_created_by_users FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: purchase_orders fk_purchase_orders_supplier_id_suppliers; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_purchase_orders_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: refund_items fk_refund_items_refund_id_refunds; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT fk_refund_items_refund_id_refunds FOREIGN KEY (refund_id) REFERENCES public.refunds(id);


--
-- Name: refund_items fk_refund_items_sale_item_id_sale_items; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT fk_refund_items_sale_item_id_sale_items FOREIGN KEY (sale_item_id) REFERENCES public.sale_items(id);


--
-- Name: refunds fk_refunds_sale_id_sales; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_sale_id_sales FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: refunds fk_refunds_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: role_permission fk_role_permission_permission_id_permissions; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_role_permission_permission_id_permissions FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permission fk_role_permission_role_id_roles; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_role_permission_role_id_roles FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: sale_items fk_sale_items_product_id_products; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT fk_sale_items_product_id_products FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sale_items fk_sale_items_sale_id_sales; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT fk_sale_items_sale_id_sales FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: sales fk_sales_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales fk_sales_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_role fk_user_role_role_id_roles; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT fk_user_role_role_id_roles FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_role fk_user_role_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT fk_user_role_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fk_users_business_id_businesses; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_business_id_businesses FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- PostgreSQL database dump complete
--

\unrestrict qXYm0LiiLTlu5aFelpz7c0g9ozkI3rugFQQ2gt0T2uXV2VuhHECwYiIQYNnDGIS

