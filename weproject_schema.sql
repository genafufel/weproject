-- Экспорт схемы weproject


-- Схема таблицы applications
CREATE TABLE IF NOT EXISTS "applications" (
  "id" integer DEFAULT nextval('applications_id_seq'::regclass) NOT NULL,
  "project_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "resume_id" integer NOT NULL,
  "status" text NOT NULL,
  "message" text,
  "created_at" timestamp without time zone DEFAULT now(),
  PRIMARY KEY ("id")
);


-- Схема таблицы messages
CREATE TABLE IF NOT EXISTS "messages" (
  "id" integer DEFAULT nextval('messages_id_seq'::regclass) NOT NULL,
  "sender_id" integer NOT NULL,
  "receiver_id" integer NOT NULL,
  "content" text NOT NULL,
  "read" boolean DEFAULT false,
  "created_at" timestamp without time zone DEFAULT now(),
  "attachment" text,
  "attachment_type" text,
  "attachment_name" text,
  "attachments" jsonb,
  "reply_to_id" integer,
  PRIMARY KEY ("id")
);


-- Схема таблицы notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" integer DEFAULT nextval('notifications_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "related_id" integer NOT NULL,
  "read" boolean DEFAULT false,
  "created_at" timestamp without time zone DEFAULT now(),
  PRIMARY KEY ("id")
);


-- Схема таблицы projects
CREATE TABLE IF NOT EXISTS "projects" (
  "id" integer DEFAULT nextval('projects_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "field" text NOT NULL,
  "positions" jsonb NOT NULL,
  "requirements" jsonb NOT NULL,
  "location" text,
  "remote" boolean DEFAULT false,
  "photos" jsonb,
  "start_date" timestamp without time zone,
  "end_date" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "moderation_status" text DEFAULT 'pending'::text NOT NULL,
  "moderation_comment" text,
  "needs_investment" boolean DEFAULT false,
  "investment_amount" numeric,
  "investment_currency" text DEFAULT 'RUB'::text,
  "investment_conditions" text,
  "investment_details" jsonb,
  PRIMARY KEY ("id")
);


-- Схема таблицы resumes
CREATE TABLE IF NOT EXISTS "resumes" (
  "id" integer DEFAULT nextval('resumes_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "title" text NOT NULL,
  "education" jsonb NOT NULL,
  "experience" jsonb NOT NULL,
  "skills" jsonb NOT NULL,
  "direction" text NOT NULL,
  "talents" jsonb,
  "photos" jsonb,
  "about" text,
  "is_public" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "moderation_status" text DEFAULT 'pending'::text NOT NULL,
  "moderation_comment" text,
  PRIMARY KEY ("id")
);


-- Схема таблицы session
CREATE TABLE IF NOT EXISTS "session" (
  "sid" character varying NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp without time zone NOT NULL,
  PRIMARY KEY ("sid")
);

-- Индексы таблицы session
CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


-- Схема таблицы users
CREATE TABLE IF NOT EXISTS "users" (
  "id" integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "email" text,
  "phone" text,
  "full_name" text NOT NULL,
  "bio" text,
  "avatar" text,
  "user_type" text DEFAULT 'general'::text NOT NULL,
  "auth_type" text NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "verification_code" text,
  "verification_code_expires" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT now(),
  "is_admin" boolean DEFAULT false NOT NULL,
  "is_applicant" boolean DEFAULT true,
  "is_project" boolean DEFAULT false,
  "is_investor" boolean DEFAULT false,
  PRIMARY KEY ("id")
);

-- Индексы таблицы users
CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username);
CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);
CREATE UNIQUE INDEX users_phone_unique ON public.users USING btree (phone);

-- Внешние ключи

-- Последовательности
-- Sequence: applications_id_seq
SELECT setval('applications_id_seq', 6, true);

-- Sequence: messages_id_seq
SELECT setval('messages_id_seq', 59, true);

-- Sequence: projects_id_seq
SELECT setval('projects_id_seq', 5, true);

-- Sequence: resumes_id_seq
SELECT setval('resumes_id_seq', 14, true);

-- Sequence: users_id_seq
SELECT setval('users_id_seq', 9, true);

-- Sequence: notifications_id_seq
SELECT setval('notifications_id_seq', 55, true);

