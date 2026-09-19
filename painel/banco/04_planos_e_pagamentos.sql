-- ===================================================
-- Eletrofit, banco de dados
-- Arquivo 4 de 4: periodicidade dos planos e historico de pagamentos
-- Rode depois dos arquivos 1, 2 e 3.
--
-- Pode rodar mais de uma vez. Nada aqui apaga dado existente:
-- todo plano que ja existia continua mensal.
-- ===================================================

-- ---------------------------------------------------
-- Periodicidade: mensal, trimestral ou anual.
-- O valor do plano passa a ser o valor do ciclo inteiro.
-- Para quem ja existia, ciclo mensal, entao o valor nao muda de sentido.
-- ---------------------------------------------------
alter table planos
  add column if not exists periodicidade text not null default 'mensal';
alter table matriculas
  add column if not exists periodicidade text not null default 'mensal';
alter table cobrancas
  add column if not exists periodicidade text not null default 'mensal';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'planos_periodicidade_ok') then
    alter table planos add constraint planos_periodicidade_ok
      check (periodicidade in ('mensal','trimestral','anual'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'matriculas_periodicidade_ok') then
    alter table matriculas add constraint matriculas_periodicidade_ok
      check (periodicidade in ('mensal','trimestral','anual'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cobrancas_periodicidade_ok') then
    alter table cobrancas add constraint cobrancas_periodicidade_ok
      check (periodicidade in ('mensal','trimestral','anual'));
  end if;
end $$;

-- Fim do periodo coberto pela cobranca. Em um plano trimestral a
-- competencia marca o inicio e esta coluna marca o ultimo mes pago.
alter table cobrancas
  add column if not exists competencia_fim date;

update cobrancas set competencia_fim = competencia where competencia_fim is null;

-- ---------------------------------------------------
-- Historico de pagamentos.
-- Uma linha por baixa dada. Desfazer uma baixa nao apaga a linha,
-- marca como estornada, entao o historico continua contando a verdade.
-- ---------------------------------------------------
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  cobranca_id uuid not null references cobrancas(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  valor numeric(10,2) not null default 0,
  pago_em date not null,
  forma text not null,
  observacao text,
  estornado boolean not null default false,
  estornado_em timestamptz,
  registrado_em timestamptz not null default now()
);
create index if not exists pagamentos_estudio_idx on pagamentos(estudio_id, pago_em desc);
create index if not exists pagamentos_aluno_idx on pagamentos(aluno_id, pago_em desc);
create index if not exists pagamentos_cobranca_idx on pagamentos(cobranca_id);

-- Mesma regra das outras tabelas: cada estudio enxerga o proprio.
alter table pagamentos enable row level security;
drop policy if exists pagamentos_tudo on pagamentos;
create policy pagamentos_tudo on pagamentos
  for all to authenticated
  using (estudio_id = meu_estudio())
  with check (estudio_id = meu_estudio());

-- ---------------------------------------------------
-- Preenche o historico com as baixas que ja existiam,
-- para nao comecar do zero em quem ja usava o painel.
-- ---------------------------------------------------
insert into pagamentos (estudio_id, cobranca_id, aluno_id, valor, pago_em, forma, observacao)
select c.estudio_id, c.id, c.aluno_id, c.valor, c.pago_em,
       coalesce(nullif(c.forma, ''), 'Não informado'),
       'Registro anterior ao historico de pagamentos'
from cobrancas c
where c.status = 'paga'
  and c.pago_em is not null
  and not exists (select 1 from pagamentos p where p.cobranca_id = c.id);
