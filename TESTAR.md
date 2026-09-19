# Conferir o redesign

## Abrir

Na raiz, execute `node preview.cjs`. Abra os dois endereços indicados no terminal.
Por padrão: `http://127.0.0.1:8766/site/` e `http://127.0.0.1:8766/painel/`.
Se a porta estiver ocupada, o terminal informa a próxima livre.

Os arquivos de configuração foram preservados. Quando estiverem vazios, o
painel oferece login de demonstração preenchido. Os dados de demonstração ficam
somente no navegador. Use uma janela privada para testar sem alterar sua demonstração habitual.

## Site

1. Confira o hero, a foto da fachada, o botão de aula experimental e a próxima
   seção em 320px, 390px, 768px, 1440px e 1920px de largura.
2. No celular, abra o menu, escolha uma seção e depois teste fechar com Escape.
3. Abra uma foto do estúdio. Avance, volte, use as setas do teclado e feche com
   Escape. O foco deve voltar à foto escolhida.
4. Abra as dúvidas. Só uma resposta fica aberta por vez.
5. Envie o agendamento vazio: os quatro campos devem mostrar erro, com foco no
   nome. Preencha os dados e confira a mensagem no WhatsApp antes de enviá-la.
6. Confira telefone, Instagram, rota e carregamento do mapa sob demanda.
7. Ative redução de movimento no sistema: nenhum conteúdo deve sumir.

## Painel

1. Entre na demonstração e percorra Hoje, Agenda, Alunos, Financeiro, Pedidos e
   Ajustes. A seção ativa deve ficar marcada no menu.
2. Em Alunos, digite uma busca aos poucos. O foco e a posição do cursor devem
   permanecer no campo. Teste filtros e um resultado vazio.
3. Cadastre um aluno de teste, abra a ficha, edite dados, ficha de saúde e plano.
4. Marque uma sessão para um aluno sem liberação de saúde. Cancele a confirmação:
   os dados do formulário devem continuar preenchidos. Confirme em uma segunda tentativa.
5. Na Agenda, avance e volte semanas, abra uma sessão, marque presença/falta,
   salve uma anotação e teste reagendamento.
6. Em Financeiro, confira os totais e o progresso. Dê baixa em uma mensalidade
   de demonstração e teste Desfazer. O progresso deve acompanhar os dados.
7. Em Pedidos, converta um contato de demonstração em aluno ou marque como atendido.
8. Em Ajustes, confira os dados do estúdio, dias, horários e planos. Teste salvar
   somente na demonstração, sem alterar a operação real.
9. Nas janelas, teste Tab, Shift+Tab, Escape e o botão Fechar. O foco deve ficar
   dentro da janela enquanto estiver aberta e voltar ao controle anterior ao fechar.

## Integrações e publicação

O redesign não altera SQL, chaves, endpoints, estrutura de dados nem Netlify.
Sem credenciais reais, o POST de solicitações pode ser verificado com interceptação
local, mas isso não valida as permissões do Supabase.

Antes da publicação, validar em um ambiente de homologação: login real,
persistência de alterações e um pedido público aparecendo em Pedidos. A auditoria
em DESIGN.md registra um ponto preexistente na política RLS de solicitações que
merece verificação. WhatsApp e mapa dependem dos serviços externos.
