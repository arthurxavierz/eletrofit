-- ===================================================
-- Eletrofit, banco de dados
-- Arquivo 3 de 3: primeiro acesso
--
-- Rode depois dos arquivos 1 e 2, e SO DEPOIS de ter
-- criado o usuario da proprietaria em
-- Authentication, Users, Add user, no painel do Supabase.
--
-- Antes de rodar, troque o texto entre aspas na linha
-- do e-mail pelo e-mail que voce cadastrou.
-- ===================================================

do $$
declare
  v_email text := 'troque@peloseuemail.com';   -- <=== troque aqui
  v_nome  text := 'Vanessa';                   -- <=== nome de quem entra
  v_usuario uuid;
  v_estudio uuid;
begin
  select id into v_usuario from auth.users where email = v_email;
  if v_usuario is null then
    raise exception 'Usuario % nao encontrado. Crie em Authentication, Users, antes de rodar este arquivo.', v_email;
  end if;

  -- cria o estudio se ainda nao existir
  select id into v_estudio from estudios where nome = 'Eletrofit Estudio';
  if v_estudio is null then
    insert into estudios (nome, whatsapp, endereco, capacidade, duracao_padrao, intervalo_recuperacao)
    values ('Eletrofit Estudio', '5534991208519',
            'Av. Jacinto Barbosa, 622, Sao Francisco, Patrocinio, MG', 2, 30, 24)
    returning id into v_estudio;
  end if;

  -- liga o usuario ao estudio
  insert into perfis (id, estudio_id, nome, papel)
  values (v_usuario, v_estudio, v_nome, 'dono')
  on conflict (id) do update set estudio_id = excluded.estudio_id, nome = excluded.nome;

  -- planos de exemplo, edite ou apague depois pelo painel
  if not exists (select 1 from planos where estudio_id = v_estudio) then
    insert into planos (estudio_id, nome, sessoes_semana, sessoes_mes, valor) values
      (v_estudio, 'Plano 1x na semana', 1, 4, 0),
      (v_estudio, 'Plano 2x na semana', 2, 8, 0),
      (v_estudio, 'Plano 3x na semana', 3, 12, 0);
  end if;

  raise notice 'Pronto. ID do estudio: %', v_estudio;
  raise notice 'Copie esse ID e cole em config.js, no campo ESTUDIO_ID.';
end $$;

-- Depois de rodar, este comando mostra o ID do estudio de novo,
-- caso voce precise consultar outra vez:
-- select id, nome from estudios;
