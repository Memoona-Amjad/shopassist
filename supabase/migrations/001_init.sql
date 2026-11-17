-- ShopAssist database schema (run once in the Supabase SQL Editor).
-- Safe to re-run: it uses "if not exists" / "or replace" everywhere.

-- pgvector gives us the "vector" column type for embeddings.
create extension if not exists vector;

-- ---------- Store data ----------

create table if not exists products (
  id          text primary key,            -- e.g. "LL-101"
  name        text not null,
  category    text not null,               -- lawn, kurta, formal, dupatta, ...
  fabric      text not null,
  price       integer not null,            -- in PKR
  sizes       text[] not null default '{}',-- e.g. {S,M,L}
  colors      text[] not null default '{}',
  description text not null,
  in_stock    boolean not null default true
);

create table if not exists orders (
  id            integer primary key,       -- e.g. 1042
  customer_name text not null,
  phone         text not null,             -- full phone, never sent to the model
  city          text not null,
  items         jsonb not null,            -- [{productId, name, size, qty, price}]
  total         integer not null,
  payment       text not null,             -- COD or Card
  status        text not null,             -- processing | shipped | delivered | returned | return_requested
  courier       text,
  tracking_no   text,
  ordered_at    timestamptz not null,
  shipped_at    timestamptz,
  delivered_at  timestamptz
);

create table if not exists returns (
  id          bigint generated always as identity primary key,
  order_id    integer not null references orders(id),
  reason      text not null,
  status      text not null default 'requested',
  created_at  timestamptz not null default now()
);

-- ---------- Agent data ----------

create table if not exists escalations (
  id              bigint generated always as identity primary key,
  conversation_id text,
  summary         text not null,
  reason          text,
  status          text not null default 'open',
  created_at      timestamptz not null default now()
);

-- One row per chat. We store the full message list (including tool calls)
-- so the admin page can replay what the agent did.
create table if not exists conversations (
  id          text primary key,
  messages    jsonb not null default '[]',
  tool_calls  integer not null default 0,
  escalated   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Per-IP daily counter used to protect the free LLM tier.
create table if not exists rate_limits (
  ip_hash  text not null,
  day      date not null,
  count    integer not null default 0,
  primary key (ip_hash, day)
);

-- ---------- RAG (policy documents) ----------

create table if not exists documents (
  id          bigint generated always as identity primary key,
  title       text not null,
  source      text not null unique,        -- file name, used as the citation
  created_at  timestamptz not null default now()
);

-- NOTE: 768 must match EMBEDDING_DIMENSIONS in .env
create table if not exists doc_chunks (
  id           bigint generated always as identity primary key,
  document_id  bigint not null references documents(id) on delete cascade,
  chunk_index  integer not null,
  heading      text,
  content      text not null,
  embedding    vector(768) not null
);

create index if not exists doc_chunks_embedding_idx
  on doc_chunks using hnsw (embedding vector_cosine_ops);

-- Semantic search: return the chunks closest to the query embedding.
create or replace function match_doc_chunks(
  query_embedding vector(768),
  match_count int default 4,
  min_similarity float default 0.5
)
returns table (
  id bigint,
  content text,
  heading text,
  source text,
  title text,
  similarity float
)
language sql stable
as $$
  select c.id, c.content, c.heading, d.source, d.title,
         1 - (c.embedding <=> query_embedding) as similarity
  from doc_chunks c
  join documents d on d.id = c.document_id
  where 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Atomically add 1 to today's counter for an IP and return the new count.
create or replace function bump_rate_limit(p_ip_hash text, p_day date)
returns integer
language sql
as $$
  insert into rate_limits (ip_hash, day, count)
  values (p_ip_hash, p_day, 1)
  on conflict (ip_hash, day) do update set count = rate_limits.count + 1
  returning count;
$$;

-- All access goes through our server using the secret key, so we turn on
-- Row Level Security with no policies: the public (anon) key can read nothing.
alter table products      enable row level security;
alter table orders        enable row level security;
alter table returns       enable row level security;
alter table escalations   enable row level security;
alter table conversations enable row level security;
alter table rate_limits   enable row level security;
alter table documents     enable row level security;
alter table doc_chunks    enable row level security;
