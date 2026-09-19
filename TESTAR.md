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
6. Em Financeiro, confira os totais e o progresso. As abas devem separar
   pendentes, próximas e tudo em aberto. Uma mensalidade vencida aparece como
   Pendente com o botão Cobrar, uma que vence em até sete dias aparece como
   Próxima com o botão Lembrar, e uma paga mostra como e quando entrou, mais a
   data da próxima cobrança.
7. Clique em Recebi. A janela deve pedir a forma de pagamento e a data, já
   preenchida com hoje e sem aceitar data futura. Registre um pagamento com data
   de ontem e confira a linha, a aba Histórico e a ficha do aluno.
8. Ainda em Financeiro, use Desfazer em uma baixa. A mensalidade volta a ficar
   em aberto e o pagamento continua no histórico, marcado como Estornado.
9. Avance um mês e clique em Gerar mensalidades. Quem tem plano mensal recebe
   cobrança todo mês; quem está no meio de um trimestre ou de um ano já pago
   fica de fora, e o aviso diz quantos foram. Clique de novo: não pode duplicar.
10. Abra a ficha de um aluno trimestral e de um anual. O plano deve nomear a
    periodicidade, o valor do ciclo, o equivalente por mês e a data da próxima
    cobrança, com o período que ela cobre.
11. Em Pedidos, converta um contato de demonstração em aluno ou marque como atendido.
12. Em Ajustes, confira os dados do estúdio, dias, horários e planos. O cadastro
    de plano deve pedir a periodicidade e tratar o valor como o do ciclo inteiro.
    Teste salvar somente na demonstração, sem alterar a operação real.
13. Nas janelas, teste Tab, Shift+Tab, Escape e o botão Fechar. O foco deve ficar
    dentro da janela enquanto estiver aberta e voltar ao controle anterior ao fechar.

## Integrações e publicação

A periodicidade dos planos e o histórico de pagamentos alteram o banco. Em uma
instalação que já estava no ar, rode `painel/banco/04_planos_e_pagamentos.sql`
antes de publicar. Ele não apaga dado: planos antigos continuam mensais e as
baixas já existentes entram no histórico. Chaves, endpoints e Netlify não mudam.
Sem credenciais reais, o POST de solicitações pode ser verificado com interceptação
local, mas isso não valida as permissões do Supabase.

Antes da publicação, validar em um ambiente de homologação: login real,
persistência de alterações e um pedido público aparecendo em Pedidos. A auditoria
em DESIGN.md registra um ponto preexistente na política RLS de solicitações que
merece verificação. WhatsApp e mapa dependem dos serviços externos.
