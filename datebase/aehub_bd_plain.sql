--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-06-21 23:18:56

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
-- TOC entry 263 (class 1255 OID 17353)
-- Name: update_chat_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_chat_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_chat_updated_at() OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 17291)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 239 (class 1259 OID 17087)
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_tokens (
    id integer NOT NULL,
    token character varying(100) NOT NULL,
    telegram_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false
);


ALTER TABLE public.auth_tokens OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17086)
-- Name: auth_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 238
-- Name: auth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_tokens_id_seq OWNED BY public.auth_tokens.id;


--
-- TOC entry 255 (class 1259 OID 17239)
-- Name: balance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    type character varying(20) NOT NULL,
    description text,
    transaction_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT balance_history_type_check CHECK (((type)::text = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying, 'purchase'::character varying, 'sale'::character varying, 'refund'::character varying, 'admin_adjustment'::character varying])::text[])))
);


ALTER TABLE public.balance_history OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 17238)
-- Name: balance_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.balance_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.balance_history_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 254
-- Name: balance_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.balance_history_id_seq OWNED BY public.balance_history.id;


--
-- TOC entry 257 (class 1259 OID 17260)
-- Name: balance_topup_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_topup_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    payment_details text,
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone,
    processed_by integer,
    CONSTRAINT balance_topup_requests_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT balance_topup_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.balance_topup_requests OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 17259)
-- Name: balance_topup_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.balance_topup_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.balance_topup_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 256
-- Name: balance_topup_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.balance_topup_requests_id_seq OWNED BY public.balance_topup_requests.id;


--
-- TOC entry 220 (class 1259 OID 16550)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    description text,
    icon character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16549)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 219
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 261 (class 1259 OID 17325)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    chat_id integer NOT NULL,
    sender_id integer NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE chat_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.chat_messages IS 'Сообщения в чатах маркетплейса';


--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN chat_messages.chat_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chat_messages.chat_id IS 'ID чата';


--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN chat_messages.sender_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chat_messages.sender_id IS 'ID отправителя сообщения';


--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN chat_messages.message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chat_messages.message IS 'Текст сообщения';


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN chat_messages.is_read; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chat_messages.is_read IS 'Прочитано ли сообщение получателем';


--
-- TOC entry 260 (class 1259 OID 17324)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 260
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 259 (class 1259 OID 17299)
-- Name: chats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chats OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE chats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.chats IS 'Чаты между покупателями и продавцами в маркетплейсе';


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN chats.listing_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chats.listing_id IS 'ID объявления, по которому создан чат';


--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN chats.buyer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chats.buyer_id IS 'ID покупателя';


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN chats.seller_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chats.seller_id IS 'ID продавца';


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN chats.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chats.updated_at IS 'Время последнего обновления чата (автоматически обновляется при новых сообщениях)';


--
-- TOC entry 258 (class 1259 OID 17298)
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chats_id_seq OWNER TO postgres;

--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 258
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- TOC entry 227 (class 1259 OID 16610)
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    resource_id integer,
    user_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16609)
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 226
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- TOC entry 241 (class 1259 OID 17102)
-- Name: content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    file_path character varying(255) NOT NULL,
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT now(),
    size integer,
    compatibility text,
    downloads_count integer DEFAULT 0,
    cover_image character varying(255),
    CONSTRAINT check_content_type CHECK (((type)::text = ANY ((ARRAY['Preset'::character varying, 'Plugin'::character varying, 'Font'::character varying, 'Sound'::character varying, 'Footage'::character varying, 'Script'::character varying, 'Graphic'::character varying, 'Pack'::character varying])::text[])))
);


ALTER TABLE public.content OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17120)
-- Name: content_examples; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_examples (
    id integer NOT NULL,
    content_id integer NOT NULL,
    file_path character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    size integer
);


ALTER TABLE public.content_examples OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 17119)
-- Name: content_examples_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.content_examples_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_examples_id_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 242
-- Name: content_examples_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.content_examples_id_seq OWNED BY public.content_examples.id;


--
-- TOC entry 240 (class 1259 OID 17101)
-- Name: content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_id_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 240
-- Name: content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.content_id_seq OWNED BY public.content.id;


--
-- TOC entry 231 (class 1259 OID 16646)
-- Name: downloads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.downloads (
    id integer NOT NULL,
    user_id integer,
    resource_id integer,
    downloaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45)
);


ALTER TABLE public.downloads OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16645)
-- Name: downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.downloads_id_seq OWNER TO postgres;

--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 230
-- Name: downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.downloads_id_seq OWNED BY public.downloads.id;


--
-- TOC entry 253 (class 1259 OID 17224)
-- Name: marketplace_escrow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_escrow (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'frozen'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    released_at timestamp without time zone,
    CONSTRAINT marketplace_escrow_status_check CHECK (((status)::text = ANY ((ARRAY['frozen'::character varying, 'released'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.marketplace_escrow OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 17223)
-- Name: marketplace_escrow_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_escrow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_escrow_id_seq OWNER TO postgres;

--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 252
-- Name: marketplace_escrow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_escrow_id_seq OWNED BY public.marketplace_escrow.id;


--
-- TOC entry 249 (class 1259 OID 17176)
-- Name: marketplace_listing_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_listing_files (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_type character varying(10) NOT NULL,
    file_size bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT marketplace_listing_files_file_type_check CHECK (((file_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'product'::character varying])::text[])))
);


ALTER TABLE public.marketplace_listing_files OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 17175)
-- Name: marketplace_listing_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_listing_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_listing_files_id_seq OWNER TO postgres;

--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 248
-- Name: marketplace_listing_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_listing_files_id_seq OWNED BY public.marketplace_listing_files.id;


--
-- TOC entry 247 (class 1259 OID 17157)
-- Name: marketplace_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_listings (
    id integer NOT NULL,
    seller_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rejection_reason text,
    CONSTRAINT marketplace_listings_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT marketplace_listings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'sold'::character varying, 'inactive'::character varying, 'deleted'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.marketplace_listings OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 17156)
-- Name: marketplace_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_listings_id_seq OWNER TO postgres;

--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 246
-- Name: marketplace_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_listings_id_seq OWNED BY public.marketplace_listings.id;


--
-- TOC entry 251 (class 1259 OID 17192)
-- Name: marketplace_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_transactions (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    dispute_reason text,
    admin_notes text,
    resolved_by integer,
    CONSTRAINT marketplace_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'disputed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.marketplace_transactions OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 17191)
-- Name: marketplace_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 250
-- Name: marketplace_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_transactions_id_seq OWNED BY public.marketplace_transactions.id;


--
-- TOC entry 233 (class 1259 OID 16664)
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16663)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 232
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 245 (class 1259 OID 17139)
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    subtitle character varying(255),
    content text,
    image_url character varying(255),
    video_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    author_id integer,
    media_url character varying(255)
);


ALTER TABLE public.news OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 17138)
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.news_id_seq OWNER TO postgres;

--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 244
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- TOC entry 225 (class 1259 OID 16594)
-- Name: resource_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_tags (
    resource_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.resource_tags OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16562)
-- Name: resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    category_id integer,
    file_path character varying(255),
    thumbnail_path character varying(255),
    is_premium boolean DEFAULT false,
    download_count integer DEFAULT 0,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resources OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16561)
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resources_id_seq OWNER TO postgres;

--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 221
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- TOC entry 235 (class 1259 OID 17061)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17060)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 234
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 229 (class 1259 OID 16631)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    user_id integer,
    plan_type character varying(20) NOT NULL,
    start_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_date timestamp without time zone NOT NULL,
    payment_id character varying(100),
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16630)
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO postgres;

--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 228
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- TOC entry 224 (class 1259 OID 16585)
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16584)
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 223
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- TOC entry 237 (class 1259 OID 17070)
-- Name: tg_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tg_users (
    id integer NOT NULL,
    telegram_id bigint NOT NULL,
    telegram_username character varying(100),
    first_name character varying(100),
    last_name character varying(100),
    role_id integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    status character varying(100),
    birth_date character varying(20),
    photo_url character varying(255),
    vip_expires_at timestamp without time zone,
    balance numeric(10,2) DEFAULT 0.00,
    last_question_at timestamp without time zone
);


ALTER TABLE public.tg_users OWNER TO postgres;

--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN tg_users.vip_expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tg_users.vip_expires_at IS 'Дата и время истечения VIP-статуса пользователя. NULL означает, что срок не ограничен или роль не VIP.';


--
-- TOC entry 236 (class 1259 OID 17069)
-- Name: tg_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tg_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tg_users_id_seq OWNER TO postgres;

--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 236
-- Name: tg_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tg_users_id_seq OWNED BY public.tg_users.id;


--
-- TOC entry 218 (class 1259 OID 16535)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_admin boolean DEFAULT false,
    is_vip boolean DEFAULT false,
    vip_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16534)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4782 (class 2604 OID 17090)
-- Name: auth_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_tokens ALTER COLUMN id SET DEFAULT nextval('public.auth_tokens_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 17242)
-- Name: balance_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history ALTER COLUMN id SET DEFAULT nextval('public.balance_history_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 17263)
-- Name: balance_topup_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_topup_requests ALTER COLUMN id SET DEFAULT nextval('public.balance_topup_requests_id_seq'::regclass);


--
-- TOC entry 4757 (class 2604 OID 16553)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 17328)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 17302)
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 16613)
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- TOC entry 4785 (class 2604 OID 17105)
-- Name: content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content ALTER COLUMN id SET DEFAULT nextval('public.content_id_seq'::regclass);


--
-- TOC entry 4788 (class 2604 OID 17123)
-- Name: content_examples id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_examples ALTER COLUMN id SET DEFAULT nextval('public.content_examples_id_seq'::regclass);


--
-- TOC entry 4773 (class 2604 OID 16649)
-- Name: downloads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads ALTER COLUMN id SET DEFAULT nextval('public.downloads_id_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 17227)
-- Name: marketplace_escrow id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_escrow ALTER COLUMN id SET DEFAULT nextval('public.marketplace_escrow_id_seq'::regclass);


--
-- TOC entry 4797 (class 2604 OID 17179)
-- Name: marketplace_listing_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listing_files ALTER COLUMN id SET DEFAULT nextval('public.marketplace_listing_files_id_seq'::regclass);


--
-- TOC entry 4793 (class 2604 OID 17160)
-- Name: marketplace_listings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listings ALTER COLUMN id SET DEFAULT nextval('public.marketplace_listings_id_seq'::regclass);


--
-- TOC entry 4799 (class 2604 OID 17195)
-- Name: marketplace_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_transactions ALTER COLUMN id SET DEFAULT nextval('public.marketplace_transactions_id_seq'::regclass);


--
-- TOC entry 4775 (class 2604 OID 16667)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 4790 (class 2604 OID 17142)
-- Name: news id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- TOC entry 4759 (class 2604 OID 16565)
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 17064)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 16634)
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- TOC entry 4764 (class 2604 OID 16588)
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- TOC entry 4778 (class 2604 OID 17073)
-- Name: tg_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tg_users ALTER COLUMN id SET DEFAULT nextval('public.tg_users_id_seq'::regclass);


--
-- TOC entry 4752 (class 2604 OID 16538)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5111 (class 0 OID 17087)
-- Dependencies: 239
-- Data for Name: auth_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_tokens (id, token, telegram_id, created_at, expires_at, is_used) FROM stdin;
2	2d03aa0497810fc32a45eed2bee8440c	\N	2025-05-17 22:42:18.359118	2025-05-17 23:12:18.306	f
4	a600b1af79067e6db78d31d9d8d1a774	7125266008	2025-05-17 22:42:18.616068	2025-05-17 23:12:18.615	t
1	f736f674007d9884e8b8c6ec65cda40f	\N	2025-05-17 22:42:18.358458	2025-05-17 23:12:18.311	f
3	dbd62b7a28824f795e255aeeebb3d900	\N	2025-05-17 22:42:18.615122	2025-05-17 23:12:18.614	f
5	7c92e8aebb4e7d879f0ddac52da4a73d	\N	2025-05-17 22:46:40.576716	2025-05-17 23:16:40.538	f
6	8c97ccb4a4b0794c2de46911e11d04fb	\N	2025-05-17 23:06:32.661763	2025-05-17 23:36:32.632	f
7	1e9894f6b767245b6f74058f2bf3ab7c	\N	2025-05-17 23:07:01.599104	2025-05-17 23:37:01.566	f
8	5efc3ec9778b18748fad87ea8733c237	\N	2025-05-17 23:07:01.709171	2025-05-17 23:37:01.565	f
9	e53174f0bc4d0ceb5b86b0af2567381f	\N	2025-05-17 23:07:13.488713	2025-05-17 23:37:13.452	f
10	a7c39d8e160a4267cac6e459ba2bf992	\N	2025-05-17 23:07:13.488948	2025-05-17 23:37:13.452	f
11	fb8f29da9a83e19c7babbb4792090c4c	\N	2025-05-17 23:08:44.190069	2025-05-17 23:38:44.048	f
12	05bacc8beaa79791faff375493917f31	\N	2025-05-17 23:10:16.628739	2025-05-17 23:40:16.493	f
13	b14b637d6cb8ae31ccc620dcb86feaa0	\N	2025-05-17 23:10:16.64349	2025-05-17 23:40:16.495	f
14	dca6c34181cf0360fd9fbcb384a4d99a	\N	2025-05-17 23:10:27.801369	2025-05-17 23:40:27.768	f
15	f07933853c7f6b2ddf7b2e15208eddd6	\N	2025-05-17 23:10:50.955832	2025-05-17 23:40:50.912	f
16	3948af05e4cec88e3e6607cd1faea010	\N	2025-05-17 23:10:50.956412	2025-05-17 23:40:50.91	f
17	db7c61aa7468f737e29fa60f39ac4e09	\N	2025-05-17 23:12:06.519258	2025-05-17 23:42:06.479	f
18	a4d7269ac3106254ac791a448deb1234	\N	2025-05-17 23:12:13.183504	2025-05-17 23:42:13.18	f
19	3f6c8571d7b9abab9a1519963a5e8f86	\N	2025-05-17 23:12:13.326203	2025-05-17 23:42:13.181	f
20	35d0a367c025edf7fa9f40915a1eb0ff	\N	2025-05-17 23:13:35.54057	2025-05-17 23:43:35.506	f
21	322e109818cf95d8d1bb5b4892a18acb	\N	2025-05-17 23:13:43.123749	2025-05-17 23:43:43.12	f
22	cc76f924207cdd1b48965d06e9ad44dc	\N	2025-05-17 23:13:43.162565	2025-05-17 23:43:43.122	f
23	3a9c2cd7d132a91ffa106b65ad93e117	\N	2025-05-17 23:14:24.590715	2025-05-17 23:44:24.548	f
24	8e918f48ebe42932b449ee380a89fb93	7125266008	2025-05-17 23:14:24.693052	2025-05-17 23:44:24.55	t
25	130978dadd6365b91838cb6dbd48a6d6	\N	2025-05-17 23:20:31.654969	2025-05-17 23:50:31.612	f
26	ba5dbb953e866b135b48668f814a46e4	\N	2025-05-17 23:20:31.655498	2025-05-17 23:50:31.614	f
27	c85494a8cf6e1ac77f6a2e159aa541e0	\N	2025-05-17 23:20:34.401291	2025-05-17 23:50:34.398	f
28	8451035bcc97c2958213de8bfa2051e0	7125266008	2025-05-17 23:20:34.401722	2025-05-17 23:50:34.399	t
29	69366a9f4c398e2ad3d805477c456d72	\N	2025-05-17 23:25:14.692863	2025-05-17 23:55:14.635	f
30	3c215311d4054c8802d8faa9496936c1	\N	2025-05-17 23:25:14.778925	2025-05-17 23:55:14.633	f
31	1041094c11064332a1a88c66202ba00a	\N	2025-05-17 23:25:33.546776	2025-05-17 23:55:33.469	f
32	338f554e77d83d1a6440a3e7fd376783	7125266008	2025-05-17 23:25:33.557016	2025-05-17 23:55:33.471	t
33	2cfd2785d4695480a355409e9c51abcd	\N	2025-05-17 23:26:37.208583	2025-05-17 23:56:37.168	f
34	cb4ca115a0c3ea67e5e78fd41f66b723	\N	2025-05-17 23:26:37.209025	2025-05-17 23:56:37.167	f
35	e3725ed3226712548abb67ff9ebc8031	\N	2025-05-17 23:28:45.004737	2025-05-17 23:58:44.962	f
36	4c0001db01508f52d6140d77245e6c62	7125266008	2025-05-17 23:28:45.005464	2025-05-17 23:58:44.96	t
37	eb8475ba438c0b730d9da7d7b5a4cd08	\N	2025-05-17 23:29:24.725229	2025-05-17 23:59:24.671	f
38	6c4e735e9646213f1702b821b2a15114	7125266008	2025-05-17 23:29:24.725725	2025-05-17 23:59:24.672	t
39	47d2db1c920a73f8ac9617fc29c31177	\N	2025-05-17 23:31:18.555179	2025-05-18 00:01:18.511	f
40	f3d89d1cc5b5e9df4eff16e47a843710	\N	2025-05-17 23:31:18.560073	2025-05-18 00:01:18.515	f
41	303717d521bc66e2ef88f26599776261	\N	2025-05-17 23:31:27.863447	2025-05-18 00:01:27.859	f
42	fe3d349aaad2fa77371e49311a8c888a	7125266008	2025-05-17 23:31:27.864776	2025-05-18 00:01:27.862	t
43	cd51bebb1fcbda322ef776f2bd74c94d	7125266008	2025-05-17 23:31:50.028018	2025-05-18 00:01:49.995	t
44	2f92e9579371647b8360f7183951b1e7	\N	2025-05-17 23:34:19.240504	2025-05-18 00:04:19.193	f
45	abcaf9806d234b0feb2f5e3b11c3cb54	7125266008	2025-05-17 23:34:19.241042	2025-05-18 00:04:19.195	t
46	8c6ca6adf8db441c9077ce25cec4ee16	\N	2025-05-18 00:27:43.801697	2025-05-18 00:57:43.76	f
47	e57d4a092e24f7221ebcd6ed517a232c	\N	2025-05-18 00:27:43.802412	2025-05-18 00:57:43.758	f
48	fcef8f6393403c751dae416af5f748d0	\N	2025-05-18 00:29:57.725853	2025-05-18 00:59:57.68	f
49	325c06fa31a353137b8ccea308b65c6b	7125266008	2025-05-18 00:29:57.726556	2025-05-18 00:59:57.677	t
50	8b46bc5b82df297b0787ac753d8858f6	\N	2025-05-18 00:31:04.214764	2025-05-18 01:01:04.171	f
51	14a9feedb94baca2e1e84882cef2334f	7125266008	2025-05-18 00:31:04.215298	2025-05-18 01:01:04.169	t
52	f365608fd3b643fb84a3b22cf1fb6363	\N	2025-05-18 00:33:23.859064	2025-05-18 01:03:23.82	f
53	c2d14d48b842efda061428124c8bbd45	7125266008	2025-05-18 00:33:23.859597	2025-05-18 01:03:23.819	t
54	b517be464129599573f831747d9b6d23	\N	2025-05-18 00:34:02.562644	2025-05-18 01:04:02.556	f
55	58d0067459a1fccede2f2c989280169b	\N	2025-05-18 00:34:02.593047	2025-05-18 01:04:02.557	f
56	fdf798a6a7464f3eb1fa5be591379c57	\N	2025-05-18 00:40:12.015354	2025-05-18 01:10:11.967	f
57	467307b71318191a66b5e816cc21f44b	7125266008	2025-05-18 00:40:12.113617	2025-05-18 01:10:11.964	t
58	66ac87e9319a7f1b3995c48908eeb2fb	\N	2025-05-18 00:54:42.49232	2025-05-18 01:24:42.487	f
59	e7956d813ba5d09e2288a4ba73f151e0	7125266008	2025-05-18 00:54:42.531142	2025-05-18 01:24:42.489	t
60	8a996ac74fc6f0617c66f30894eabb57	\N	2025-05-18 00:55:18.367606	2025-05-18 01:25:18.33	f
61	70a8d744738fa12376fc888d23949f92	\N	2025-05-18 00:55:19.7011	2025-05-18 01:25:19.697	f
62	267c37bb04305a4e6b590c9c00792f95	7125266008	2025-05-18 00:55:19.742863	2025-05-18 01:25:19.698	t
63	aa6f6de37c7c5967d27366cb92e3f97d	\N	2025-05-18 00:55:26.571036	2025-05-18 01:25:26.567	f
64	539bd0ebf00dd023e44dd883e3081816	7125266008	2025-05-18 00:55:26.571641	2025-05-18 01:25:26.569	t
65	12bb45083b9ded5fd64dbeda7710c31f	\N	2025-05-18 02:07:31.93491	2025-05-18 02:37:31.927	f
66	8bfa31f35933c2d7c28a8279ebba09d4	\N	2025-05-18 02:07:31.96385	2025-05-18 02:37:31.929	f
67	e9594846cb2e6ec37a1848cd51a53494	\N	2025-05-18 10:55:46.33657	2025-05-18 11:25:46.295	f
68	3ae2749653d66dc12096dd9e250cadb4	\N	2025-05-18 10:55:46.338458	2025-05-18 11:25:46.293	f
69	34ff21f11bef6dac4b8683382746cc0d	\N	2025-05-18 10:57:39.633675	2025-05-18 11:27:39.595	f
70	fb245e60f974b04faba5248242fbdcfc	7125266008	2025-05-18 10:57:39.739135	2025-05-18 11:27:39.593	t
71	07376973ba15dd648ae87c71d79e48bd	\N	2025-05-18 10:58:36.217828	2025-05-18 11:28:36.213	f
72	25d3673d9023700215d348f7df91b1bf	7125266008	2025-05-18 10:58:36.370627	2025-05-18 11:28:36.215	t
73	5638806ec8ad1643541225d48b2f1e7a	\N	2025-05-18 11:19:57.236074	2025-05-18 11:49:57.228	f
74	91ce07078c2cac563d8deea1da290763	7125266008	2025-05-18 11:19:57.373181	2025-05-18 11:49:57.23	t
75	20f54eb9637602ac3ea85eb72ee015f5	\N	2025-05-18 11:20:08.766694	2025-05-18 11:50:08.763	f
76	eee116b7507ee6d7f78ae76747d5bbe1	7125266008	2025-05-18 11:20:08.797138	2025-05-18 11:50:08.764	t
77	b5f49a73719a14b97da91aa4890e35d1	\N	2025-05-18 11:30:00.500199	2025-05-18 12:00:00.496	f
78	6ed58df996989dbc6aefc1ed9a4ff541	\N	2025-05-18 11:30:00.532456	2025-05-18 12:00:00.497	f
79	74b225f3725c2cacecf224db4ce1d1fb	\N	2025-05-18 11:34:25.420545	2025-05-18 12:04:25.414	f
80	030cc8154a3dd5f2c858d470164d5863	7125266008	2025-05-18 11:34:25.557656	2025-05-18 12:04:25.417	t
81	1f00fc31637bf393dfe602ef721418e4	\N	2025-05-18 11:37:17.875287	2025-05-18 12:07:17.825	f
82	dddfdaaeee0fa9b2fc8863de0d06cb6b	7125266008	2025-05-18 11:37:17.980062	2025-05-18 12:07:17.822	t
83	cd8e190ef650c21a7bd3931abba142a4	\N	2025-05-18 14:42:47.93691	2025-05-18 15:12:47.929	f
84	ede9f95677fd2902760bb452d45e23b5	\N	2025-05-18 14:42:47.965963	2025-05-18 15:12:47.931	f
85	4fdbc4e98f5fab95aa846f8737d29918	\N	2025-05-18 14:50:03.992943	2025-05-18 15:20:03.954	f
86	9995148b7e33915c142cab72d84e1e4f	\N	2025-05-18 14:50:03.99338	2025-05-18 15:20:03.953	f
87	6620cf7aa000b1683744a29c714ed7a2	\N	2025-05-18 14:56:48.747553	2025-05-18 15:26:48.732	f
88	67f1fa4969d28ef0effeaf8b1ef61ecd	\N	2025-05-18 14:56:48.782522	2025-05-18 15:26:48.734	f
89	5c00f57d49785d644d5c6df7159cb1d0	\N	2025-05-18 15:04:48.136115	2025-05-18 15:34:48.13	f
90	5377d74c904f0245545db21bb1dc76a3	7125266008	2025-05-18 15:04:48.174592	2025-05-18 15:34:48.133	t
91	369360e0a41da40a7c1c239cbc94333b	\N	2025-05-18 15:37:18.417449	2025-05-18 16:07:18.409	f
92	18e072054f5046d4b869442ec4dc0b39	\N	2025-05-18 15:37:18.557843	2025-05-18 16:07:18.412	f
93	e065900d66f05d51f3a0082f7dfb1d4a	\N	2025-05-18 19:25:47.385926	2025-05-18 19:55:47.345	f
94	642a9f3d50943cf7d0e67f4d6a67b167	\N	2025-05-18 19:25:47.386487	2025-05-18 19:55:47.346	f
95	603a1895cd38e635188e259054e61e89	\N	2025-05-18 19:39:23.316133	2025-05-18 20:09:23.308	f
96	36f038993eb53d63f784d5706393e80c	\N	2025-05-18 19:39:23.349601	2025-05-18 20:09:23.31	f
97	8f77d54bf1677b6b09b0c685509701f2	\N	2025-05-18 19:40:16.630977	2025-05-18 20:10:16.591	f
98	e7bbca3120806021897afa4417341835	7125266008	2025-05-18 19:40:16.734694	2025-05-18 20:10:16.589	t
99	2fc822731275b8fb5ca1276d12ec21fc	\N	2025-05-18 19:46:50.760194	2025-05-18 20:16:50.753	f
100	69e56bf63bca44bf3c1445b2aab0e42f	7125266008	2025-05-18 19:46:50.788649	2025-05-18 20:16:50.755	t
101	535965c15e30a3c38de2af48fe717240	\N	2025-05-18 20:30:58.042693	2025-05-18 21:00:57.996	f
102	89f0ddd04a8fe33282f05b15320b76ac	\N	2025-05-18 20:30:58.130133	2025-05-18 21:00:57.992	f
103	03f4ab33d7eef64e72d7663670db9166	\N	2025-05-18 21:25:25.802189	2025-05-18 21:55:25.793	f
104	cfe5260d682399bddbffabfa3eb9d50d	\N	2025-05-18 21:25:25.833027	2025-05-18 21:55:25.795	f
105	c7e6fd5868a04f59ae3296ddf66194da	\N	2025-05-18 21:32:16.119487	2025-05-18 22:02:16.079	f
106	3dfe68a5c764461f005792c2d4bd36cc	\N	2025-05-18 21:32:16.120136	2025-05-18 22:02:16.077	f
107	adb103eeeae2254ce63607010354bdfb	\N	2025-05-18 22:29:26.504341	2025-05-18 22:59:26.501	f
108	1ffe13b593e94798becc62e788e8d921	\N	2025-05-18 22:29:26.536837	2025-05-18 22:59:26.502	f
109	9345f0aefafe44f63715701e0f42fe19	\N	2025-05-18 22:59:56.802878	2025-05-18 23:29:56.762	f
110	4561b8ddcc641a76c703b55158a8f1a3	7125266008	2025-05-18 22:59:56.902661	2025-05-18 23:29:56.764	t
111	4423fce9e430f28b69e5ea77fe2f2862	\N	2025-05-18 23:51:23.577352	2025-05-19 00:21:23.571	f
112	53368b6b16043c8344328204ad210e84	7125266008	2025-05-18 23:51:23.57783	2025-05-19 00:21:23.572	t
113	e8679d0cc74fe0c8eb4165078214d402	\N	2025-05-18 23:53:20.907602	2025-05-19 00:23:20.905	f
114	3b9c2bf7fbb8642ac1ba2109e2f6f904	\N	2025-05-18 23:53:20.911681	2025-05-19 00:23:20.906	f
115	24595ca79f4db931f4b898f7321241a3	\N	2025-05-19 00:06:21.520255	2025-05-19 00:36:21.515	f
116	b72a007d6ba668f13fdf1218054ddf76	\N	2025-05-19 00:06:21.664874	2025-05-19 00:36:21.517	f
117	87bc5b6bccee961b86d319babd24f97e	\N	2025-05-19 00:08:09.157195	2025-05-19 00:38:09.151	f
118	fcfdeba60d92812efa98c9f3f4571de0	7125266008	2025-05-19 00:08:09.198154	2025-05-19 00:38:09.154	t
119	71f2f4ce64d696fa7eceed6e2449126f	\N	2025-05-19 17:27:07.091696	2025-05-19 17:57:07.085	f
120	350654277f895eb73d98bddeb3d7c857	\N	2025-05-19 17:27:07.119274	2025-05-19 17:57:07.086	f
121	7b73857cbb1abc7df6e74843f8f172d5	\N	2025-05-24 15:22:01.376334	2025-05-24 15:52:01.334	f
122	8f282c1303fec4da3f5c2ed0b788b97d	7125266008	2025-05-24 15:22:01.482027	2025-05-24 15:52:01.337	t
123	f212165058ca083a9ddfbcb757f45043	\N	2025-05-24 15:35:04.874655	2025-05-24 16:05:04.87	f
124	bc8a25912ef34be8a5eba063513b3663	7913829462	2025-05-24 15:35:04.900647	2025-05-24 16:05:04.872	t
125	0d88925b74fdaaaa973d76b66bd255ea	\N	2025-05-24 15:35:34.432415	2025-05-24 16:05:34.427	f
126	14ac02b5ea6fc01498e9c37da775fc60	7913829462	2025-05-24 15:35:34.458778	2025-05-24 16:05:34.429	t
127	467842c4b06ee23b6669798d7b3ecdb4	\N	2025-05-24 15:40:12.819351	2025-05-24 16:10:12.816	f
128	6eb5d43962d83a6658ac70e6a27a8769	7913829462	2025-05-24 15:40:12.846293	2025-05-24 16:10:12.817	t
129	0e8b9c7ef53c374684cd05a9ff2db3cd	\N	2025-05-24 16:00:24.373961	2025-05-24 16:30:24.366	f
130	79504d12d2936ff32d3c477f34384fa2	7125266008	2025-05-24 16:00:24.402334	2025-05-24 16:30:24.371	t
131	e8b712f3280b6208c2a1f86b5f144089	\N	2025-05-24 16:41:31.627088	2025-05-24 17:11:31.623	f
132	9d402e98570a845c9aa17c6747a3d121	7913829462	2025-05-24 16:41:31.656702	2025-05-24 17:11:31.625	t
133	50313eb5040c40cbcefe794c44767400	\N	2025-05-24 17:01:26.911832	2025-05-24 17:31:26.908	f
134	a1cdfa22626d6e494e0b12d640f35a4b	7125266008	2025-05-24 17:01:27.042761	2025-05-24 17:31:26.909	t
135	abbc98449d44e32b9657d100ade5f430	\N	2025-05-24 17:06:20.011796	2025-05-24 17:36:19.969	f
136	b80c7bd235e8bc6f44ab73809370d2b8	\N	2025-05-24 17:06:20.014501	2025-05-24 17:36:19.971	f
137	af25b725b121b1af0a143f8a609d315f	\N	2025-05-24 17:06:55.506966	2025-05-24 17:36:55.501	f
138	7d47a041207239bfff6239d1720ec246	7913829462	2025-05-24 17:06:55.53289	2025-05-24 17:36:55.504	t
139	f1083bcc67e756f7ebd669df647819da	\N	2025-05-24 17:36:25.536162	2025-05-24 18:06:25.53	f
140	e53bf4c8f500f4d5c730c6b1f86163f0	7125266008	2025-05-24 17:36:25.561547	2025-05-24 18:06:25.534	t
141	ffd6ed38c3a012d522a85cc8f493253b	\N	2025-05-24 18:09:04.442658	2025-05-24 18:39:04.407	f
142	cb94805c57413fce77d2bc4bac60d09d	7913829462	2025-05-24 18:09:04.443178	2025-05-24 18:39:04.403	t
143	eb51a48d253bf3305c64dbf6b8e6bc54	\N	2025-05-24 18:09:35.885737	2025-05-24 18:39:35.881	f
144	714316f8eb1290ce6e70a4b6ed2da376	7125266008	2025-05-24 18:09:36.025067	2025-05-24 18:39:35.883	t
145	301afd9de702fa874ca37ccf6ec00dde	\N	2025-05-24 19:21:58.813117	2025-05-24 19:51:58.78	f
146	5d416d641e2fe0d996f406dda2a41758	7125266008	2025-05-24 19:21:58.814315	2025-05-24 19:51:58.777	t
147	cc196e65debe4f9722f6d6048b006038	\N	2025-05-25 00:48:10.826249	2025-05-25 01:18:10.823	f
148	9d7d17590bf00b8fe2144c8b9c85606e	7913829462	2025-05-25 00:48:10.850381	2025-05-25 01:18:10.824	t
149	12db462bdc0fb0789b4b07c4195f7b97	\N	2025-05-25 02:26:55.79395	2025-05-25 02:56:55.789	f
151	762f0c3335f8c1e20ad555c1fff584df	\N	2025-05-25 02:26:57.017069	2025-05-25 02:56:57.012	f
152	447f3bc8ce3b8ff189c364b7c74b0dfe	\N	2025-05-25 02:26:57.018276	2025-05-25 02:56:57.014	f
150	80eb1d465021fa0c5ff6750031841616	7125266008	2025-05-25 02:26:55.795275	2025-05-25 02:56:55.791	t
153	530d35db50f228c9157ad87165e9a37a	\N	2025-05-25 02:29:14.43279	2025-05-25 02:59:14.4	f
154	f0049e2849de2de1bec427b399da8fd9	7913829462	2025-05-25 02:29:14.434927	2025-05-25 02:59:14.404	t
155	02d617a067fbfb7b13dd6a81f0707ecc	\N	2025-05-25 02:36:42.592384	2025-05-25 03:06:42.589	f
156	afc389f9ed54e07b3d8323cb54ed1a31	7125266008	2025-05-25 02:36:42.61711	2025-05-25 03:06:42.59	t
157	0679dfd5f651c7e6b5b8fa564ef628f6	\N	2025-05-25 02:51:12.785627	2025-05-25 03:21:12.782	f
158	58e4079257594ee47d2966f1d8a7d31e	7913829462	2025-05-25 02:51:12.808937	2025-05-25 03:21:12.783	t
159	d6e45cc91231513306d524b544ceacd7	\N	2025-05-25 03:13:36.063063	2025-05-25 03:43:36.058	f
160	2cdc74b1ba2bf06fbd38962d7fe3ce4b	7913829462	2025-05-25 03:13:36.063561	2025-05-25 03:43:36.059	t
161	0faaf51c386991e6e24b2564230f8471	\N	2025-05-25 03:17:36.737944	2025-05-25 03:47:36.707	f
162	ca0bfc8e1650771fd14e39d45a56395e	7125266008	2025-05-25 03:17:36.738255	2025-05-25 03:47:36.708	t
163	8dbcbe2e8fa684dc3ca21e5d8b4a436e	\N	2025-05-25 03:23:19.462408	2025-05-25 03:53:19.433	f
164	92ff07c320c07801852ea6722f3a5548	7913829462	2025-05-25 03:23:19.462737	2025-05-25 03:53:19.434	t
165	ac3d8a796230ccf9ecd459271efa899f	\N	2025-05-25 03:29:14.277214	2025-05-25 03:59:14.273	f
166	575ccbecad9d7a4dfeb56fbc34c27a03	7125266008	2025-05-25 03:29:14.277614	2025-05-25 03:59:14.274	t
167	7f0a798d80425d50f41f44ead33f69eb	\N	2025-05-25 03:31:29.588119	2025-05-25 04:01:29.586	f
168	255b818055819b420bf81b412d607e88	7913829462	2025-05-25 03:31:29.590585	2025-05-25 04:01:29.586	t
169	8b0d370512a0f971294fd5d3525ee12f	\N	2025-05-25 03:47:33.393521	2025-05-25 04:17:33.365	f
170	9259558d04a09103a363699c9697374f	7125266008	2025-05-25 03:47:33.393823	2025-05-25 04:17:33.364	t
171	0993aa7cdabd9ade75214a0e5f16294f	\N	2025-05-25 03:51:46.583591	2025-05-25 04:21:46.555	f
172	b467302d3365f517fd53564d5e151dae	7913829462	2025-05-25 03:51:46.58387	2025-05-25 04:21:46.556	t
173	aa561ef7d36f401a42b7ec02dd2228fd	\N	2025-05-25 08:54:21.349323	2025-05-25 09:24:21.319	f
174	f2089421aa7579c85cd22becf5365e58	7125266008	2025-05-25 08:54:21.349645	2025-05-25 09:24:21.32	t
175	b6d2d237cf411ad525b71fdb352931eb	\N	2025-05-25 08:55:19.192967	2025-05-25 09:25:19.189	f
176	0a4617439eb9f83e1b9313c5d7bd5b8a	7125266008	2025-05-25 08:55:19.193689	2025-05-25 09:25:19.191	t
177	201cb61587e092a16746f43adbc19102	\N	2025-05-25 22:27:32.533105	2025-05-25 22:57:32.529	f
178	3af53f6c16f6d7129d8d867437bd50fa	7125266008	2025-05-25 22:27:32.558419	2025-05-25 22:57:32.531	t
179	0d254a1cf8e08edb0f05fd92c22af2de	7125266008	2025-05-25 23:14:04.081297	2025-05-25 23:44:04.078	t
180	9dfacd3ad7da6957e374b66d3a1f4fd4	\N	2025-06-15 19:58:58.23668	2025-06-15 20:28:58.207	f
181	14ffa56489624397a0950ed091d1cbd2	\N	2025-06-15 19:59:03.796919	2025-06-15 20:29:03.794	f
182	6fe7ca29ed41d47b32cb1973e81633cf	\N	2025-06-15 19:59:57.766757	2025-06-15 20:29:57.764	f
183	932c97cf9d0892481b38dbdeaf8ba9b7	\N	2025-06-15 19:59:57.792798	2025-06-15 20:29:57.765	f
184	9e6191448f3bd211470c1dd0d870d833	\N	2025-06-15 20:17:12.906153	2025-06-15 20:47:12.903	f
185	90763173eb2be4715a7aee5c5998a011	\N	2025-06-15 20:17:13.031985	2025-06-15 20:47:12.904	f
186	f6fa4b82c9d4e337450012b7fb63707c	\N	2025-06-16 12:20:14.245	2025-06-16 12:50:14.113	f
187	316dc1e5ce3b9151ca21c0664a0460e4	7125266008	2025-06-16 12:20:14.268355	2025-06-16 12:50:14.116	t
188	2cedc53ac1cfd45667c6cece09338c46	\N	2025-06-21 18:21:52.80011	2025-06-21 18:51:52.798	f
189	8feaa8e593b2a7fbcfb8963bfd49d579	7125266008	2025-06-21 18:21:52.826522	2025-06-21 18:51:52.798	t
\.


--
-- TOC entry 5127 (class 0 OID 17239)
-- Dependencies: 255
-- Data for Name: balance_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_history (id, user_id, amount, type, description, transaction_id, created_at) FROM stdin;
\.


--
-- TOC entry 5129 (class 0 OID 17260)
-- Dependencies: 257
-- Data for Name: balance_topup_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_topup_requests (id, user_id, amount, status, payment_method, payment_details, admin_notes, created_at, processed_at, processed_by) FROM stdin;
\.


--
-- TOC entry 5092 (class 0 OID 16550)
-- Dependencies: 220
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, icon, created_at) FROM stdin;
1	Пресеты	presets	Пресеты для FL Studio	layer-group	2025-05-17 21:18:47.231826
2	Плагины	plugins	Плагины для FL Studio	bolt	2025-05-17 21:18:47.231826
3	Шрифты	fonts	Шрифты для проектов	font	2025-05-17 21:18:47.231826
4	Звуки	sounds	Звуковые эффекты и музыка	music	2025-05-17 21:18:47.231826
5	Футажи	footage	Видео футажи	film	2025-05-17 21:18:47.231826
6	Скрипты	scripts	Скрипты для автоматизации	code	2025-05-17 21:18:47.231826
7	Графика	graphics	Графические элементы	pen-nib	2025-05-17 21:18:47.231826
8	Паки	packs	Наборы ресурсов	box	2025-05-17 21:18:47.231826
\.


--
-- TOC entry 5133 (class 0 OID 17325)
-- Dependencies: 261
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, chat_id, sender_id, message, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5131 (class 0 OID 17299)
-- Dependencies: 259
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chats (id, listing_id, buyer_id, seller_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5099 (class 0 OID 16610)
-- Dependencies: 227
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, resource_id, user_id, content, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5113 (class 0 OID 17102)
-- Dependencies: 241
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content (id, title, type, description, file_path, uploaded_by, created_at, size, compatibility, downloads_count, cover_image) FROM stdin;
15	миси	Preset	иссмии	https://storage.yandexcloud.net/flhub-files/content/preset/file-1750453888114-490200743.aep	2093	2025-06-21 00:11:28.610591	171007	сисмисммис	3	https://storage.yandexcloud.net/flhub-files/covers/cover_image-1750453888115-63975349.jpg
\.


--
-- TOC entry 5115 (class 0 OID 17120)
-- Dependencies: 243
-- Data for Name: content_examples; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content_examples (id, content_id, file_path, type, title, created_at, size) FROM stdin;
13	15	https://storage.yandexcloud.net/flhub-files/examples/example-1750453888616-768967111.jpg	image	\N	2025-06-21 00:11:28.830219	98553
\.


--
-- TOC entry 5103 (class 0 OID 16646)
-- Dependencies: 231
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.downloads (id, user_id, resource_id, downloaded_at, ip_address) FROM stdin;
\.


--
-- TOC entry 5125 (class 0 OID 17224)
-- Dependencies: 253
-- Data for Name: marketplace_escrow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_escrow (id, transaction_id, amount, status, created_at, released_at) FROM stdin;
\.


--
-- TOC entry 5121 (class 0 OID 17176)
-- Dependencies: 249
-- Data for Name: marketplace_listing_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_listing_files (id, listing_id, file_name, file_path, file_type, file_size, created_at) FROM stdin;
\.


--
-- TOC entry 5119 (class 0 OID 17157)
-- Dependencies: 247
-- Data for Name: marketplace_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_listings (id, seller_id, title, description, category, price, status, created_at, updated_at, rejection_reason) FROM stdin;
\.


--
-- TOC entry 5123 (class 0 OID 17192)
-- Dependencies: 251
-- Data for Name: marketplace_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_transactions (id, listing_id, buyer_id, seller_id, amount, status, created_at, completed_at, dispute_reason, admin_notes, resolved_by) FROM stdin;
\.


--
-- TOC entry 5105 (class 0 OID 16664)
-- Dependencies: 233
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, name, applied_at) FROM stdin;
1	001-create-roles-users.sql	2025-05-17 22:10:01.925383
2	002-create-auth-tokens.sql	2025-05-17 22:30:45.932352
3	003-add-user-fields.sql	2025-05-18 01:11:50.030155
6	004-create-content-table.sql	2025-05-18 11:09:05.718002
7	005-add-compatibility-to-content.sql	2025-05-18 11:45:09.295171
8	006-create-content-examples-table.sql	2025-05-18 11:56:23.993056
9	003_add_downloads_count_to_content.sql	2025-05-18 15:35:27.57916
10	005-add-vip-expiry.sql	2025-05-18 16:20:06.652475
11	004_create_news_table.js	2025-05-18 17:27:17.126421
12	005_add_media_url_to_news.js	2025-05-19 00:11:23.784088
13	add_marketplace_tables.sql	2025-05-24 18:50:13.230125
14	add_marketplace_moderation.sql	2025-05-24 20:04:38.305947
15	fix_marketplace_file_types.sql	2025-05-24 21:48:07.205132
16	add_chat_tables.sql	2025-05-25 01:01:13.525551
17	007_add_cover_image_to_content.sql	2025-06-20 23:19:06.828529
\.


--
-- TOC entry 5117 (class 0 OID 17139)
-- Dependencies: 245
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news (id, title, subtitle, content, image_url, video_url, created_at, updated_at, author_id, media_url) FROM stdin;
10	TEST FL HUB	первый тест	ТЕСТИМ ПРОГУ. ГОНЯЕМ ЕЕ ПО ПОЛНОЙ ИЩЕМ БАГИ. ЕСЛИ НАШЛИ ТО ЖЕЛАТЕЛЬНО С ФОТО ПИШЕМ В ЧАТ ПОДРОБНО. ЕСЛИ ЕСТЬ КАКИЕ ТО ПОЖЕЛАНИЯ НА ФУНЦИИ КОТОРЫЕ УЖЕ СОЗДАНЫ ТО ПИШИТЕ ТОЖ	\N	https://storage.yandexcloud.net/flhub-files/news/news-1748202073073-578966899.mp4	2025-05-19 00:37:30.48756	2025-05-25 22:41:24.919253	2093	\N
\.


--
-- TOC entry 5097 (class 0 OID 16594)
-- Dependencies: 225
-- Data for Name: resource_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_tags (resource_id, tag_id) FROM stdin;
\.


--
-- TOC entry 5094 (class 0 OID 16562)
-- Dependencies: 222
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resources (id, title, description, category_id, file_path, thumbnail_path, is_premium, download_count, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5107 (class 0 OID 17061)
-- Dependencies: 235
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	BASIC
2	VIP
3	ADMIN
4	CEO
\.


--
-- TOC entry 5101 (class 0 OID 16631)
-- Dependencies: 229
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, user_id, plan_type, start_date, end_date, payment_id, amount, status, created_at) FROM stdin;
\.


--
-- TOC entry 5096 (class 0 OID 16585)
-- Dependencies: 224
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, name, created_at) FROM stdin;
\.


--
-- TOC entry 5109 (class 0 OID 17070)
-- Dependencies: 237
-- Data for Name: tg_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tg_users (id, telegram_id, telegram_username, first_name, last_name, role_id, created_at, status, birth_date, photo_url, vip_expires_at, balance, last_question_at) FROM stdin;
4	7913829462	audioterror	CEO AUDIOTERROR	\N	2	2025-05-17 23:22:18.343597	\N	\N	https://api.telegram.org/file/bot7691324824:AAE5yDpAsIDS10gQd3h95Pt_h8K4mEc0BM4/photos/file_33.jpg	2025-07-20 21:58:31.772	0.00	2025-05-25 10:08:39.397
2093	7125266008	mollywok	flhub.org	\N	4	2025-05-17 22:25:27.692199	vgfgfdgfdgf	\N	https://api.telegram.org/file/bot7691324824:AAE5yDpAsIDS10gQd3h95Pt_h8K4mEc0BM4/photos/file_32.jpg	\N	0.00	\N
\.


--
-- TOC entry 5090 (class 0 OID 16535)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, is_admin, is_vip, vip_until, created_at, updated_at) FROM stdin;
1	admin	admin@flhub.com	temporary_password_hash	t	f	\N	2025-05-17 21:18:47.231826	2025-05-17 21:18:47.231826
\.


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 238
-- Name: auth_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_tokens_id_seq', 189, true);


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 254
-- Name: balance_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.balance_history_id_seq', 36, true);


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 256
-- Name: balance_topup_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.balance_topup_requests_id_seq', 1, false);


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 219
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 9, true);


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 260
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 25, true);


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 258
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chats_id_seq', 3, true);


--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 226
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 242
-- Name: content_examples_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_examples_id_seq', 14, true);


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 240
-- Name: content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_id_seq', 15, true);


--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 230
-- Name: downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.downloads_id_seq', 1, false);


--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 252
-- Name: marketplace_escrow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_escrow_id_seq', 11, true);


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 248
-- Name: marketplace_listing_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_listing_files_id_seq', 29, true);


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 246
-- Name: marketplace_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_listings_id_seq', 13, true);


--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 250
-- Name: marketplace_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_transactions_id_seq', 11, true);


--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 232
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 17, true);


--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 244
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_id_seq', 10, true);


--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 221
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resources_id_seq', 1, false);


--
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 234
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 228
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, false);


--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 223
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 1, false);


--
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 236
-- Name: tg_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tg_users_id_seq', 12, true);


--
-- TOC entry 5193 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 4864 (class 2606 OID 17094)
-- Name: auth_tokens auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 17096)
-- Name: auth_tokens auth_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_token_key UNIQUE (token);


--
-- TOC entry 4893 (class 2606 OID 17248)
-- Name: balance_history balance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 17271)
-- Name: balance_topup_requests balance_topup_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_topup_requests
    ADD CONSTRAINT balance_topup_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4832 (class 2606 OID 16558)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4834 (class 2606 OID 16560)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 4908 (class 2606 OID 17334)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 17308)
-- Name: chats chats_listing_id_buyer_id_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_listing_id_buyer_id_seller_id_key UNIQUE (listing_id, buyer_id, seller_id);


--
-- TOC entry 4902 (class 2606 OID 17306)
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 16619)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 17128)
-- Name: content_examples content_examples_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_examples
    ADD CONSTRAINT content_examples_pkey PRIMARY KEY (id);


--
-- TOC entry 4870 (class 2606 OID 17110)
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 16652)
-- Name: downloads downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 17232)
-- Name: marketplace_escrow marketplace_escrow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_escrow
    ADD CONSTRAINT marketplace_escrow_pkey PRIMARY KEY (id);


--
-- TOC entry 4884 (class 2606 OID 17185)
-- Name: marketplace_listing_files marketplace_listing_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listing_files
    ADD CONSTRAINT marketplace_listing_files_pkey PRIMARY KEY (id);


--
-- TOC entry 4882 (class 2606 OID 17169)
-- Name: marketplace_listings marketplace_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 17202)
-- Name: marketplace_transactions marketplace_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_transactions
    ADD CONSTRAINT marketplace_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 16672)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4852 (class 2606 OID 16670)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4877 (class 2606 OID 17148)
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 16598)
-- Name: resource_tags resource_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_pkey PRIMARY KEY (resource_id, tag_id);


--
-- TOC entry 4836 (class 2606 OID 16573)
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 17068)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4856 (class 2606 OID 17066)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 16639)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 16593)
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- TOC entry 4840 (class 2606 OID 16591)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 17076)
-- Name: tg_users tg_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tg_users
    ADD CONSTRAINT tg_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 17078)
-- Name: tg_users tg_users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tg_users
    ADD CONSTRAINT tg_users_telegram_id_key UNIQUE (telegram_id);


--
-- TOC entry 4826 (class 2606 OID 16548)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4828 (class 2606 OID 16544)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 16546)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4867 (class 1259 OID 17098)
-- Name: idx_auth_tokens_telegram_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auth_tokens_telegram_id ON public.auth_tokens USING btree (telegram_id);


--
-- TOC entry 4868 (class 1259 OID 17097)
-- Name: idx_auth_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auth_tokens_token ON public.auth_tokens USING btree (token);


--
-- TOC entry 4894 (class 1259 OID 17288)
-- Name: idx_balance_history_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_history_user ON public.balance_history USING btree (user_id);


--
-- TOC entry 4897 (class 1259 OID 17290)
-- Name: idx_balance_topup_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_topup_requests_status ON public.balance_topup_requests USING btree (status);


--
-- TOC entry 4898 (class 1259 OID 17289)
-- Name: idx_balance_topup_requests_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_topup_requests_user ON public.balance_topup_requests USING btree (user_id);


--
-- TOC entry 4909 (class 1259 OID 17349)
-- Name: idx_chat_messages_chat_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages USING btree (chat_id);


--
-- TOC entry 4910 (class 1259 OID 17351)
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- TOC entry 4911 (class 1259 OID 17352)
-- Name: idx_chat_messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_is_read ON public.chat_messages USING btree (is_read);


--
-- TOC entry 4912 (class 1259 OID 17350)
-- Name: idx_chat_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages USING btree (sender_id);


--
-- TOC entry 4903 (class 1259 OID 17345)
-- Name: idx_chats_buyer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_buyer_id ON public.chats USING btree (buyer_id);


--
-- TOC entry 4904 (class 1259 OID 17347)
-- Name: idx_chats_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_listing_id ON public.chats USING btree (listing_id);


--
-- TOC entry 4905 (class 1259 OID 17346)
-- Name: idx_chats_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_seller_id ON public.chats USING btree (seller_id);


--
-- TOC entry 4906 (class 1259 OID 17348)
-- Name: idx_chats_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_updated_at ON public.chats USING btree (updated_at);


--
-- TOC entry 4871 (class 1259 OID 17117)
-- Name: idx_content_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_type ON public.content USING btree (type);


--
-- TOC entry 4872 (class 1259 OID 17118)
-- Name: idx_content_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_uploaded_by ON public.content USING btree (uploaded_by);


--
-- TOC entry 4878 (class 1259 OID 17283)
-- Name: idx_marketplace_listings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_listings_category ON public.marketplace_listings USING btree (category);


--
-- TOC entry 4879 (class 1259 OID 17282)
-- Name: idx_marketplace_listings_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_listings_seller ON public.marketplace_listings USING btree (seller_id);


--
-- TOC entry 4880 (class 1259 OID 17284)
-- Name: idx_marketplace_listings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_listings_status ON public.marketplace_listings USING btree (status);


--
-- TOC entry 4885 (class 1259 OID 17285)
-- Name: idx_marketplace_transactions_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_transactions_buyer ON public.marketplace_transactions USING btree (buyer_id);


--
-- TOC entry 4886 (class 1259 OID 17286)
-- Name: idx_marketplace_transactions_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_transactions_seller ON public.marketplace_transactions USING btree (seller_id);


--
-- TOC entry 4887 (class 1259 OID 17287)
-- Name: idx_marketplace_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_transactions_status ON public.marketplace_transactions USING btree (status);


--
-- TOC entry 4857 (class 1259 OID 17085)
-- Name: idx_tg_users_telegram_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tg_users_telegram_id ON public.tg_users USING btree (telegram_id);


--
-- TOC entry 4858 (class 1259 OID 17137)
-- Name: idx_tg_users_vip_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tg_users_vip_expires_at ON public.tg_users USING btree (vip_expires_at);


--
-- TOC entry 4875 (class 1259 OID 17154)
-- Name: news_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX news_created_at_idx ON public.news USING btree (created_at DESC);


--
-- TOC entry 4943 (class 2620 OID 17355)
-- Name: chat_messages trigger_update_chat_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_chat_updated_at AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_chat_updated_at();


--
-- TOC entry 4942 (class 2620 OID 17292)
-- Name: marketplace_listings update_marketplace_listings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4933 (class 2606 OID 17254)
-- Name: balance_history balance_history_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.marketplace_transactions(id);


--
-- TOC entry 4934 (class 2606 OID 17249)
-- Name: balance_history balance_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tg_users(id) ON DELETE CASCADE;


--
-- TOC entry 4935 (class 2606 OID 17277)
-- Name: balance_topup_requests balance_topup_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_topup_requests
    ADD CONSTRAINT balance_topup_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.tg_users(id);


--
-- TOC entry 4936 (class 2606 OID 17272)
-- Name: balance_topup_requests balance_topup_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_topup_requests
    ADD CONSTRAINT balance_topup_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tg_users(id) ON DELETE CASCADE;


--
-- TOC entry 4940 (class 2606 OID 17335)
-- Name: chat_messages chat_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- TOC entry 4941 (class 2606 OID 17340)
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.tg_users(id) ON DELETE CASCADE;


--
-- TOC entry 4937 (class 2606 OID 17314)
-- Name: chats chats_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.tg_users(id) ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 17309)
-- Name: chats chats_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- TOC entry 4939 (class 2606 OID 17319)
-- Name: chats chats_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.tg_users(id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 16620)
-- Name: comments comments_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- TOC entry 4918 (class 2606 OID 16625)
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4924 (class 2606 OID 17129)
-- Name: content_examples content_examples_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_examples
    ADD CONSTRAINT content_examples_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE;


--
-- TOC entry 4923 (class 2606 OID 17111)
-- Name: content content_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.tg_users(id);


--
-- TOC entry 4920 (class 2606 OID 16658)
-- Name: downloads downloads_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);


--
-- TOC entry 4921 (class 2606 OID 16653)
-- Name: downloads downloads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4932 (class 2606 OID 17233)
-- Name: marketplace_escrow marketplace_escrow_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_escrow
    ADD CONSTRAINT marketplace_escrow_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.marketplace_transactions(id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 17186)
-- Name: marketplace_listing_files marketplace_listing_files_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listing_files
    ADD CONSTRAINT marketplace_listing_files_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 17170)
-- Name: marketplace_listings marketplace_listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.tg_users(id) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 17208)
-- Name: marketplace_transactions marketplace_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_transactions
    ADD CONSTRAINT marketplace_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.tg_users(id);


--
-- TOC entry 4929 (class 2606 OID 17203)
-- Name: marketplace_transactions marketplace_transactions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_transactions
    ADD CONSTRAINT marketplace_transactions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id);


--
-- TOC entry 4930 (class 2606 OID 17218)
-- Name: marketplace_transactions marketplace_transactions_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_transactions
    ADD CONSTRAINT marketplace_transactions_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.tg_users(id);


--
-- TOC entry 4931 (class 2606 OID 17213)
-- Name: marketplace_transactions marketplace_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_transactions
    ADD CONSTRAINT marketplace_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.tg_users(id);


--
-- TOC entry 4925 (class 2606 OID 17149)
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.tg_users(id) ON DELETE SET NULL;


--
-- TOC entry 4915 (class 2606 OID 16599)
-- Name: resource_tags resource_tags_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- TOC entry 4916 (class 2606 OID 16604)
-- Name: resource_tags resource_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 16574)
-- Name: resources resources_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4914 (class 2606 OID 16579)
-- Name: resources resources_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4919 (class 2606 OID 16640)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4922 (class 2606 OID 17079)
-- Name: tg_users tg_users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tg_users
    ADD CONSTRAINT tg_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


-- Completed on 2025-06-21 23:18:56

--
-- PostgreSQL database dump complete
--

