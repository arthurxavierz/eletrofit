-- ===================================================
-- Eletrofit, banco de dados
-- Arquivo 1 de 3: tabelas
-- Rode este arquivo primeiro, no SQL Editor do Supabase.
-- ===================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------
-- Estudio. Cada linha e um estudio.
-- Existe desde o comeco para o dia em que o sistema
-- atender mais de um cliente.
-- ---------------------------------------------------
create table if not exists estudios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text,
  endereco text,
  capacidade int not null default 2,          -- quantos coletes ao mesmo tempo
  duracao_padrao int not null default 30,     -- minutos por sessao
  intervalo_recuperacao int not null default 24, -- horas minimas entre sessoes
  abre time not null default '07:00',
  fecha time not null default '20:30',
  dias_semana int[] not null default '{1,2,3,4,5}', -- 0 domingo, 6 sabado
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------
-- Perfis. Liga o usuario que faz login ao estudio.
-- Aluno nao tem login, entao nao entra aqui.
-- ---------------------------------------------------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  estudio_id uuid not null references estudios(id) on delete cascade,
  nome text not null,
  papel text not null default 'equipe' check (papel in ('dono','equipe')),
  criado_em timestamptz not null default now()
);
create index if not exists perfis_estudio_idx on perfis(estudio_id);

-- ---------------------------------------------------
-- Alunos
-- ---------------------------------------------------
create table if not exists alunos (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  nascimento date,
  objetivo text,
  status text not null default 'ativo' check (status in ('ativo','experimental','inativo')),
  saude_liberado boolean not null default false,
  saude_restricoes text,
  saude_atualizado_em date,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists alunos_estudio_idx on alunos(estudio_id);
create index if not exists alunos_nome_idx on alunos(estudio_id, lower(nome));

-- ---------------------------------------------------
-- Planos. O que o estudio vende.
-- ---------------------------------------------------
create table if not exists planos (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  nome text not null,
  sessoes_semana int not null default 2,
  sessoes_mes int not null default 8,
  valor numeric(10,2) not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists planos_estudio_idx on planos(estudio_id);

-- ---------------------------------------------------
-- Matriculas. O plano que o aluno assinou.
-- ---------------------------------------------------
create table if not exists matriculas (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  plano_id uuid references planos(id) on delete set null,
  inicio date not null default current_date,
  fim date,
  dia_vencimento int not null default 10 check (dia_vencimento between 1 and 28),
  valor numeric(10,2) not null default 0,
  status text not null default 'ativa' check (status in ('ativa','encerrada')),
  criado_em timestamptz not null default now()
);
create index if not exists matriculas_estudio_idx on matriculas(estudio_id);
create index if not exists matriculas_aluno_idx on matriculas(aluno_id);
create unique index if not exists matriculas_uma_ativa_por_aluno
  on matriculas(aluno_id) where status = 'ativa';

-- ---------------------------------------------------
-- Sessoes. A agenda.
-- ---------------------------------------------------
create table if not exists sessoes (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  inicio timestamptz not null,
  duracao int not null default 30,
  status text not null default 'agendada' check (status in ('agendada','realizada','falta','cancelada')),
  intensidade text,
  observacao text,
  criado_em timestamptz not null default now()
);
create index if not exists sessoes_estudio_inicio_idx on sessoes(estudio_id, inicio);
create index if not exists sessoes_aluno_idx on sessoes(aluno_id, inicio desc);

-- ---------------------------------------------------
-- Cobrancas. As mensalidades.
-- competencia guarda o mes de referencia, sempre no dia 1.
-- ---------------------------------------------------
create table if not exists cobrancas (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  matricula_id uuid references matriculas(id) on delete set null,
  competencia date not null,
  vencimento date not null,
  valor numeric(10,2) not null default 0,
  status text not null default 'aberta' check (status in ('aberta','paga','cancelada')),
  pago_em date,
  forma text,
  observacao text,
  criado_em timestamptz not null default now()
);
create index if not exists cobrancas_estudio_idx on cobrancas(estudio_id, competencia);
create index if not exists cobrancas_aluno_idx on cobrancas(aluno_id, competencia desc);
create index if not exists cobrancas_vencimento_idx on cobrancas(estudio_id, status, vencimento);
create unique index if not exists cobrancas_sem_repetir
  on cobrancas(matricula_id, competencia) where matricula_id is not null;

-- ---------------------------------------------------
-- Solicitacoes. O que chega do formulario do site.
-- ---------------------------------------------------
create table if not exists solicitacoes (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  nome text not null,
  telefone text,
  objetivo text,
  periodo text,
  origem text not null default 'site',
  status text not null default 'nova' check (status in ('nova','atendida','descartada')),
  criado_em timestamptz not null default now()
);
create index if not exists solicitacoes_estudio_idx on solicitacoes(estudio_id, status, criado_em desc);

-- ---------------------------------------------------
-- Marca a data de alteracao do aluno
-- ---------------------------------------------------
create or replace function marcar_atualizacao()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists alunos_atualizado on alunos;
create trigger alunos_atualizado before update on alunos
for each row execute function marcar_atualizacao();
