-- ===================================================
-- Eletrofit, banco de dados
-- Arquivo 2 de 3: permissoes (RLS)
-- Rode depois do arquivo 1.
--
-- Regra geral: quem esta logado so enxerga o proprio
-- estudio. O site publico so consegue inserir uma
-- solicitacao, e nao consegue ler nada.
-- ===================================================

-- Descobre o estudio do usuario logado.
-- security definer evita que a propria regra de perfis
-- entre em laco ao ser consultada.
create or replace function meu_estudio()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select estudio_id from perfis where id = auth.uid()
$$;

revoke all on function meu_estudio() from public;
grant execute on function meu_estudio() to authenticated;

alter table estudios      enable row level security;
alter table perfis        enable row level security;
alter table alunos        enable row level security;
alter table planos        enable row level security;
alter table matriculas    enable row level security;
alter table sessoes       enable row level security;
alter table cobrancas     enable row level security;
alter table solicitacoes  enable row level security;

-- ---------------------------------------------------
-- Estudio: le e edita o proprio
-- ---------------------------------------------------
drop policy if exists estudios_ler on estudios;
create policy estudios_ler on estudios
  for select to authenticated using (id = meu_estudio());

drop policy if exists estudios_editar on estudios;
create policy estudios_editar on estudios
  for update to authenticated using (id = meu_estudio()) with check (id = meu_estudio());

-- ---------------------------------------------------
-- Perfis: cada um le o proprio perfil
-- ---------------------------------------------------
drop policy if exists perfis_ler on perfis;
create policy perfis_ler on perfis
  for select to authenticated using (id = auth.uid());

-- ---------------------------------------------------
-- Demais tabelas: tudo dentro do proprio estudio
-- ---------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['alunos','planos','matriculas','sessoes','cobrancas'] loop
    execute format('drop policy if exists %I_tudo on %I', t, t);
    execute format(
      'create policy %I_tudo on %I for all to authenticated
         using (estudio_id = meu_estudio())
         with check (estudio_id = meu_estudio())', t, t);
  end loop;
end $$;

-- ---------------------------------------------------
-- Solicitacoes:
-- quem esta logado faz tudo dentro do proprio estudio,
-- o site publico apenas insere.
-- ---------------------------------------------------
drop policy if exists solicitacoes_tudo on solicitacoes;
create policy solicitacoes_tudo on solicitacoes
  for all to authenticated
  using (estudio_id = meu_estudio())
  with check (estudio_id = meu_estudio());

drop policy if exists solicitacoes_do_site on solicitacoes;
create policy solicitacoes_do_site on solicitacoes
  for insert to anon
  with check (
    origem = 'site'
    and status = 'nova'
    and char_length(nome) between 2 and 120
    and (telefone is null or char_length(telefone) <= 40)
    and (objetivo is null or char_length(objetivo) <= 120)
    and (periodo is null or char_length(periodo) <= 120)
    and exists (select 1 from estudios e where e.id = estudio_id)
  );
