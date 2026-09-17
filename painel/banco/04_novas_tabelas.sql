-- ===================================================
-- Eletrofit, banco de dados
-- Arquivo 4: protocolos de treino, avaliacoes fisicas,
-- modelos de mensagem e metas do estudio.
--
-- Rode depois dos arquivos 1, 2 e 3. Pode rodar mais de
-- uma vez, nada e duplicado nem apagado.
-- ===================================================

-- ---------------------------------------------------
-- Metas do estudio, mostradas em barra no painel
-- ---------------------------------------------------
alter table estudios add column if not exists meta_faturamento numeric(10,2) not null default 0;
alter table estudios add column if not exists meta_alunos int not null default 0;

-- ---------------------------------------------------
-- Protocolos de treino.
-- A receita que a equipe segue dentro do estudio:
-- frequencia, largura de pulso e o que fazer.
-- ---------------------------------------------------
create table if not exists protocolos (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  nome text not null,
  foco text,                                   -- emagrecimento, forca, postura
  duracao int not null default 25,             -- minutos
  frequencia int not null default 75,          -- Hz
  largura_pulso int not null default 350,      -- microssegundos
  nivel text,                                  -- faixa sugerida, exemplo 5 a 7
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists protocolos_estudio_idx on protocolos(estudio_id);

-- A sessao passa a guardar qual protocolo foi aplicado.
alter table sessoes add column if not exists protocolo_id uuid references protocolos(id) on delete set null;
create index if not exists sessoes_protocolo_idx on sessoes(protocolo_id);

-- ---------------------------------------------------
-- Avaliacoes fisicas.
-- Uma linha por medicao. A evolucao sai da comparacao
-- entre a primeira e a ultima.
-- ---------------------------------------------------
create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  data date not null default current_date,
  peso numeric(5,1),
  altura numeric(3,2),
  gordura numeric(4,1),
  massa_magra numeric(5,1),
  cintura numeric(5,1),
  quadril numeric(5,1),
  braco numeric(4,1),
  coxa numeric(4,1),
  observacao text,
  criado_em timestamptz not null default now()
);
create index if not exists avaliacoes_aluno_idx on avaliacoes(aluno_id, data desc);
create index if not exists avaliacoes_estudio_idx on avaliacoes(estudio_id);

-- ---------------------------------------------------
-- Modelos de mensagem.
-- O texto padrao que o estudio manda no WhatsApp.
-- As chaves entre chaves sao trocadas pelo painel:
-- {nome}, {valor}, {vencimento}, {data}, {hora}, {estudio}
-- ---------------------------------------------------
create table if not exists modelos_mensagem (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references estudios(id) on delete cascade,
  titulo text not null,
  categoria text,
  texto text not null,
  criado_em timestamptz not null default now()
);
create index if not exists modelos_estudio_idx on modelos_mensagem(estudio_id);

-- ---------------------------------------------------
-- Permissoes: mesma regra das outras tabelas.
-- Cada usuario so enxerga o proprio estudio.
-- ---------------------------------------------------
alter table protocolos        enable row level security;
alter table avaliacoes        enable row level security;
alter table modelos_mensagem  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['protocolos','avaliacoes','modelos_mensagem'] loop
    execute format('drop policy if exists %I_tudo on %I', t, t);
    execute format(
      'create policy %I_tudo on %I for all to authenticated
         using (estudio_id = meu_estudio())
         with check (estudio_id = meu_estudio())', t, t);
  end loop;
end $$;

-- ---------------------------------------------------
-- Protocolos e mensagens para comecar.
-- So entram se o estudio ainda nao tiver nenhum.
-- ---------------------------------------------------
do $$
declare e uuid;
begin
  for e in select id from estudios loop
    if not exists (select 1 from protocolos where estudio_id = e) then
      insert into protocolos (estudio_id, nome, foco, duracao, frequencia, largura_pulso, nivel, descricao) values
        (e, 'Base, adaptacao', 'Adaptacao', 20, 60, 350, '3 a 5',
         'Para as quatro primeiras sessoes. Estimulo curto e intensidade baixa, o aluno aprende a contrair junto com o pulso antes de subir carga.'),
        (e, 'Queima, circuito continuo', 'Emagrecimento', 25, 85, 350, '5 a 7',
         'Pulso curto e pausa curta, movimento sem parar. Agachamento, remada, prancha e passada, sem descanso entre as trocas.'),
        (e, 'Forca, membros inferiores', 'Fortalecimento', 25, 75, 400, '6 a 8',
         'Pulso longo com pausa para recuperar. Agachamento, avanco, elevacao de quadril e panturrilha em quatro series.'),
        (e, 'Centro do corpo e postura', 'Postura', 20, 70, 300, '4 a 6',
         'Abdomen, lombar e gluteo. Indicado para quem passa o dia sentado ou chega reclamando de dor nas costas.'),
        (e, 'Recuperacao, pulso baixo', 'Recuperacao', 15, 7, 250, '2 a 4',
         'Frequencia baixa para soltar a musculatura. Usado depois de treino pesado ou em semana de dor muscular.');
    end if;

    if not exists (select 1 from modelos_mensagem where estudio_id = e) then
      insert into modelos_mensagem (estudio_id, titulo, categoria, texto) values
        (e, 'Lembrete de treino', 'Agenda',
         'Oi {nome}, tudo bem? Passando para confirmar seu treino de {data} as {hora} na Eletrofit. Pode confirmar para mim?'),
        (e, 'Cobranca sem constrangimento', 'Financeiro',
         'Oi {nome}, tudo bem? Sua mensalidade de {valor} venceu dia {vencimento}. Se ficar mais facil eu mando o Pix por aqui mesmo.'),
        (e, 'Convite para aula experimental', 'Vendas',
         'Oi {nome}, aqui e da Eletrofit. A aula experimental e gratuita e dura trinta minutos. Qual dia dessa semana fica melhor para voce?'),
        (e, 'Aluno sumido', 'Retencao',
         'Oi {nome}, senti sua falta no estudio essa semana. Quer que eu ja separe um horario para voce?'),
        (e, 'Parabens de aniversario', 'Relacionamento',
         'Feliz aniversario, {nome}! Toda a equipe da Eletrofit deseja um dia excelente.'),
        (e, 'Depois da primeira aula', 'Vendas',
         'Oi {nome}, como ficou o corpo depois da primeira sessao? Qualquer duvida e so chamar por aqui.');
    end if;
  end loop;
end $$;
