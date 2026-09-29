-- ===================================================
-- Eletrofit, banco de dados
-- Arquivo 5: confirmacao de aulas, reposicoes e agenda do site
-- Rode depois dos arquivos 1 a 4.
--
-- Pode rodar mais de uma vez. Nada aqui apaga dado existente.
--
-- O que este arquivo liga:
--  1. Confirmacao de presenca. Cada sessao ganha um link unico que
--     vai na mensagem do WhatsApp. O aluno abre e responde Vou ou
--     Nao vou, sem login. A resposta cai direto no painel.
--  2. Reposicao. Quem avisa que nao vai com a antecedencia minima
--     (3 horas por padrao) ganha direito a repor a aula.
--  3. Agenda do site. Quem visita o site ve os horarios livres e
--     escolhe dia e hora da aula experimental. O pedido chega no
--     painel com o horario, pronto para confirmar.
-- ===================================================

-- ---------------------------------------------------
-- Estudio: prazo para desmarcar e fuso da agenda
-- ---------------------------------------------------
alter table estudios
  add column if not exists antecedencia_cancelamento int not null default 3;  -- horas
alter table estudios
  add column if not exists fuso text not null default 'America/Sao_Paulo';
alter table estudios
  add column if not exists agenda_no_site boolean not null default true;

-- ---------------------------------------------------
-- Sessoes: confirmacao e reposicao
-- ---------------------------------------------------
alter table sessoes add column if not exists token uuid not null default gen_random_uuid();
create unique index if not exists sessoes_token_idx on sessoes(token);

-- null: ainda sem resposta. confirmada ou recusada: o aluno respondeu.
alter table sessoes add column if not exists confirmacao text;
-- 'aluno' quando respondeu pelo link, 'estudio' quando foi marcado no painel
alter table sessoes add column if not exists confirmacao_por text;
alter table sessoes add column if not exists confirmacao_em timestamptz;
-- quando a mensagem de confirmacao foi aberta no WhatsApp pelo painel
alter table sessoes add column if not exists aviso_enviado_em timestamptz;

-- recusou dentro do prazo: pode repor
alter table sessoes add column if not exists reposicao_direito boolean not null default false;
-- a proprietaria decidiu nao repor
alter table sessoes add column if not exists reposicao_dispensada boolean not null default false;
-- nesta sessao o aluno repoe outra
alter table sessoes add column if not exists reposicao_de uuid references sessoes(id) on delete set null;
-- sessao marcada a partir de um pedido de aula experimental
alter table sessoes add column if not exists experimental boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sessoes_confirmacao_ok') then
    alter table sessoes add constraint sessoes_confirmacao_ok
      check (confirmacao is null or confirmacao in ('confirmada','recusada'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sessoes_confirmacao_por_ok') then
    alter table sessoes add constraint sessoes_confirmacao_por_ok
      check (confirmacao_por is null or confirmacao_por in ('aluno','estudio'));
  end if;
end $$;

create index if not exists sessoes_reposicao_idx on sessoes(estudio_id) where reposicao_direito;
create index if not exists sessoes_reposicao_de_idx on sessoes(reposicao_de) where reposicao_de is not null;

-- ---------------------------------------------------
-- Solicitacoes: dia e hora escolhidos no site
-- ---------------------------------------------------
alter table solicitacoes add column if not exists data_desejada date;
alter table solicitacoes add column if not exists horario_desejado time;
alter table solicitacoes add column if not exists sessao_id uuid references sessoes(id) on delete set null;

-- ---------------------------------------------------
-- O site publico nao le a tabela de estudios, entao a regra antiga
-- de insercao, que consultava essa tabela, recusava todo pedido.
-- Esta funcao responde apenas se o estudio existe.
-- ---------------------------------------------------
create or replace function estudio_existe(p_estudio uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from estudios where id = p_estudio)
$$;

revoke all on function estudio_existe(uuid) from public;
grant execute on function estudio_existe(uuid) to anon, authenticated;

drop policy if exists solicitacoes_do_site on solicitacoes;
create policy solicitacoes_do_site on solicitacoes
  for insert to anon
  with check (
    origem = 'site'
    and status = 'nova'
    and sessao_id is null
    and char_length(nome) between 2 and 120
    and (telefone is null or char_length(telefone) <= 40)
    and (objetivo is null or char_length(objetivo) <= 120)
    and (periodo is null or char_length(periodo) <= 120)
    and (data_desejada is null or data_desejada between current_date and current_date + 60)
    and estudio_existe(estudio_id)
  );

-- ---------------------------------------------------
-- Agenda do site: quais horarios estao tomados.
-- Devolve so os horarios, nunca nomes ou telefones.
-- Conta as sessoes marcadas e os pedidos novos que ja
-- escolheram horario, para dois visitantes nao pegarem
-- o mesmo lugar.
-- ---------------------------------------------------
create or replace function agenda_publica(p_estudio uuid, p_de date, p_dias int default 21)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  e estudios%rowtype;
  v_ini timestamptz;
  v_fim timestamptz;
  v_ocupados jsonb;
begin
  select * into e from estudios where id = p_estudio;
  if not found or not e.agenda_no_site then
    return null;
  end if;

  p_dias := least(greatest(coalesce(p_dias, 21), 1), 45);
  v_ini := (greatest(p_de, current_date))::timestamp at time zone e.fuso;
  v_fim := v_ini + make_interval(days => p_dias);

  select coalesce(jsonb_agg(jsonb_build_object('inicio', o.inicio, 'duracao', o.duracao) order by o.inicio), '[]'::jsonb)
    into v_ocupados
  from (
    select s.inicio, s.duracao
      from sessoes s
     where s.estudio_id = p_estudio
       and s.status in ('agendada','realizada')
       and s.inicio >= v_ini and s.inicio < v_fim
    union all
    select ((q.data_desejada + q.horario_desejado)::timestamp at time zone e.fuso), e.duracao_padrao
      from solicitacoes q
     where q.estudio_id = p_estudio
       and q.status = 'nova'
       and q.data_desejada is not null and q.horario_desejado is not null
       and ((q.data_desejada + q.horario_desejado)::timestamp at time zone e.fuso) >= v_ini
       and ((q.data_desejada + q.horario_desejado)::timestamp at time zone e.fuso) < v_fim
  ) o;

  return jsonb_build_object(
    'abre', to_char(e.abre, 'HH24:MI'),
    'fecha', to_char(e.fecha, 'HH24:MI'),
    'dias_semana', to_jsonb(e.dias_semana),
    'duracao', e.duracao_padrao,
    'capacidade', e.capacidade,
    'fuso', e.fuso,
    'ocupados', v_ocupados
  );
end;
$$;

revoke all on function agenda_publica(uuid, date, int) from public;
grant execute on function agenda_publica(uuid, date, int) to anon, authenticated;

-- ---------------------------------------------------
-- Pagina de confirmacao: o que o aluno ve ao abrir o link.
-- So o primeiro nome, o dia e a hora.
-- ---------------------------------------------------
create or replace function sessao_para_confirmar(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'nome', split_part(trim(a.nome), ' ', 1),
    'inicio', s.inicio,
    'duracao', s.duracao,
    'status', s.status,
    'confirmacao', s.confirmacao,
    'reposicao_direito', s.reposicao_direito,
    'antecedencia', e.antecedencia_cancelamento,
    'prazo', s.inicio - make_interval(hours => e.antecedencia_cancelamento),
    'estudio', e.nome,
    'whatsapp', e.whatsapp,
    'fuso', e.fuso
  )
  from sessoes s
  join alunos a on a.id = s.aluno_id
  join estudios e on e.id = s.estudio_id
  where s.token = p_token
$$;

revoke all on function sessao_para_confirmar(uuid) from public;
grant execute on function sessao_para_confirmar(uuid) to anon, authenticated;

-- ---------------------------------------------------
-- Resposta do aluno.
--   Vou: marca como confirmada.
--   Nao vou, dentro do prazo: libera o horario e da direito a repor.
--   Nao vou, fora do prazo: libera o horario, sem reposicao.
-- A regra do prazo fica aqui, no banco, e nao no navegador.
-- ---------------------------------------------------
create or replace function responder_sessao(p_token uuid, p_vai boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  s sessoes%rowtype;
  v_antecedencia int;
  v_prazo timestamptz;
begin
  select * into s from sessoes where token = p_token for update;
  if not found then
    return jsonb_build_object('resultado', 'nao_encontrada');
  end if;

  select antecedencia_cancelamento into v_antecedencia from estudios where id = s.estudio_id;
  v_prazo := s.inicio - make_interval(hours => v_antecedencia);

  if s.inicio <= now() then
    return jsonb_build_object('resultado', 'passou');
  end if;

  -- ja disse que nao vai: nao reabre sozinho, para nao furar a capacidade
  if s.confirmacao = 'recusada' then
    return jsonb_build_object('resultado', 'ja_recusou', 'reposicao_direito', s.reposicao_direito);
  end if;

  if s.status <> 'agendada' then
    return jsonb_build_object('resultado', 'indisponivel');
  end if;

  if p_vai then
    update sessoes
       set confirmacao = 'confirmada', confirmacao_por = 'aluno', confirmacao_em = now()
     where id = s.id;
    return jsonb_build_object('resultado', 'confirmada');
  end if;

  update sessoes
     set confirmacao = 'recusada', confirmacao_por = 'aluno', confirmacao_em = now(),
         status = 'cancelada', reposicao_direito = (now() <= v_prazo)
   where id = s.id;

  return jsonb_build_object(
    'resultado', case when now() <= v_prazo then 'recusada' else 'recusada_fora_do_prazo' end,
    'reposicao_direito', now() <= v_prazo
  );
end;
$$;

revoke all on function responder_sessao(uuid, boolean) from public;
grant execute on function responder_sessao(uuid, boolean) to anon, authenticated;
