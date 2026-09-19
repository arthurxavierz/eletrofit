# Painel Eletrofit

Sistema de gestão do estúdio: agenda, alunos, ficha de saúde, planos,
mensalidades e os pedidos que chegam pelo site.

Feito em HTML, CSS e JavaScript puros. Não tem build, não tem framework e não
precisa de servidor próprio. É a mesma lógica do site: publicar a pasta já
coloca no ar. O banco de dados é o Supabase.

O visual usa fundo claro, grafite, divisórias e amarelo elétrico nos comandos
principais e na navegação ativa. Verde e vermelho indicam situações como pago,
atrasado e falta. Tipografia, cores e a marca ligam o painel ao site público.
Hoje e Financeiro incluem indicadores de progresso calculados dos dados reais.
No celular, o menu permanece na parte inferior e os controles têm área de toque
de pelo menos 44px. As janelas prendem o foco, fecham com Escape e preservam o
formulário quando uma confirmação é cancelada.

Quem entra no painel é a proprietária e a equipe. O aluno não tem login, ele é
apenas um cadastro. Isso deixa o sistema mais simples e mais seguro.

---

## Como o painel está organizado

```
painel/
├── index.html      Casca da página
├── painel.css      Estilos
├── config.js       O arquivo que você preenche
├── favicon.png     Ícone da aba
├── banco/
│   ├── 01_tabelas.sql        As tabelas
│   ├── 02_permissoes.sql     Quem pode ver o quê
│   ├── 03_primeiro_acesso.sql Cria o estúdio e liga o seu usuário
│   └── 04_planos_e_pagamentos.sql Periodicidade dos planos e histórico
├── img/
│   └── eletrofit-raio.png
└── js/
    ├── app.js       Login e troca de tela
    ├── db.js        Todo o acesso aos dados
    ├── estado.js    Guarda quem está logado
    ├── ui.js        Botões, formulários e janelas
    ├── util.js      Datas, dinheiro, telefone
    └── telas/       Uma pasta por tela do sistema
```

## Modo demonstração

Com o `config.js` vazio, o painel abre com dados de exemplo guardados no próprio
navegador. Serve para você clicar em tudo antes de configurar, e serve também
para mostrar o sistema pronto para um cliente novo sem precisar criar nada.

O painel usa módulos JavaScript e precisa ser servido por HTTP. Na raiz do
repositório, execute `node preview.cjs` e use o endereço do painel exibido.
Também é possível servir apenas a pasta com Python instalado:

```bash
cd painel
python3 -m http.server 8000
```

Entre com qualquer e-mail e senha. Em Ajustes existe um botão para recarregar os
dados de exemplo.

---

# Tutorial: colocar no ar

São seis etapas. Do começo ao fim leva perto de uma hora na primeira vez.

## Etapa 1. Criar o projeto no Supabase

1. Entre em supabase.com e crie um projeto novo.
2. Escolha a região South America, São Paulo. Fica mais rápido para Patrocínio.
3. Guarde a senha do banco que ele pedir. Você não vai usar no dia a dia, mas
   não dá para recuperar depois.
4. Espere terminar de criar, leva alguns minutos.

## Etapa 2. Criar as tabelas

1. No menu da esquerda, abra **SQL Editor**.
2. Abra o arquivo `banco/01_tabelas.sql` deste repositório, copie tudo, cole no
   editor e clique em Run.
3. Faça o mesmo com o `banco/02_permissoes.sql`.
4. Ainda não rode o arquivo 03. Ele é a próxima etapa.

Quem já tinha o banco no ar antes da periodicidade dos planos precisa rodar
também o `banco/04_planos_e_pagamentos.sql`. Ele acrescenta a periodicidade, cria
o histórico de pagamentos e não apaga nada: todo plano que já existia continua
mensal, e as baixas antigas entram no histórico. Em uma instalação nova o arquivo
01 já traz tudo isso, e rodar o 04 depois também não faz mal.

Se aparecer erro, leia a mensagem: quase sempre é um arquivo rodado fora de
ordem. Rodar de novo o mesmo arquivo não faz mal, ele foi escrito para isso.

## Etapa 3. Criar o acesso da proprietária

1. No menu da esquerda, abra **Authentication**, depois **Users**.
2. Clique em **Add user**, opção **Create new user**.
3. Coloque o e-mail dela e uma senha. Marque a opção de e-mail já confirmado,
   se aparecer.
4. Volte ao **SQL Editor**, abra o arquivo `banco/03_primeiro_acesso.sql`,
   troque `troque@peloseuemail.com` pelo e-mail que você acabou de cadastrar,
   troque o nome se quiser, e clique em Run.
5. Na resposta vai aparecer uma linha com o **ID do estúdio**. Copie esse
   código, você usa na próxima etapa. Se perder, rode `select id, nome from estudios;`.

## Etapa 4. Preencher os dois arquivos de configuração

No painel do Supabase, abra **Project Settings**, depois **API**. Você precisa
de dois valores: o **Project URL** e a chave **anon public**.

Preencha o arquivo `painel/config.js`:

```js
export const CONFIG = {
  SUPABASE_URL: "https://seuprojeto.supabase.co",
  SUPABASE_ANON_KEY: "cole aqui a chave anon",
  ESTUDIO_ID: "cole aqui o ID do estudio",
};
```

E o arquivo `site/config.js`, do site, com os mesmos três valores:

```js
window.ELETROFIT_CONFIG = {
  SUPABASE_URL: "https://seuprojeto.supabase.co",
  SUPABASE_ANON_KEY: "cole aqui a chave anon",
  ESTUDIO_ID: "cole aqui o ID do estudio",
};
```

A chave anon pode ficar no código sem problema. Sozinha ela não abre nada, quem
manda são as regras que você criou na etapa 2. A chave `service_role`, essa sim,
nunca deve entrar em nenhum arquivo do site ou do painel.

Depois de preencher, salve, faça o commit e mande para o GitHub.

## Etapa 5. Publicar no Netlify

São dois sites do Netlify, saindo do mesmo repositório. Um publica a pasta
`site`, o outro publica a pasta `painel`. Os arquivos `netlify.toml` do
repositório já dizem ao Netlify qual pasta é qual, então quase não há o que
configurar na tela.

**Site público**

1. No Netlify, **Add new site**, **Import an existing project**, escolha o
   repositório `eletrofit`.
2. Deixe a **Base directory** vazia e o campo de build vazio. O `netlify.toml`
   da raiz já manda publicar a pasta `site`.
3. Clique em **Deploy**. É esse site que recebe o domínio principal.

**Painel**

1. Repita **Add new site**, **Import an existing project**, e escolha o mesmo
   repositório `eletrofit`.
2. Aqui muda uma coisa só: em **Base directory**, escreva `painel`. Isso faz o
   Netlify ler o `painel/netlify.toml` e publicar a pasta do painel.
3. Deixe o campo de build vazio e clique em **Deploy**.

Se um site subir em branco ou com erro 404, quase sempre é a Base directory: o
público fica vazia, o painel fica `painel`. Cada push no GitHub atualiza os dois
sozinho.

## Etapa 6. Apontar o domínio no Cloudflare

1. No Netlify, em cada site, abra **Domain settings** e adicione o domínio.
   Sugestão: `eletrofit.com.br` para o site e `painel.eletrofit.com.br` para o
   painel.
2. No Cloudflare, crie os registros que o Netlify pedir.
3. Importante: deixe os registros em **DNS only**, com a nuvem cinza. Com a
   nuvem laranja ligada, o Cloudflare fica na frente do Netlify e costuma dar
   problema de certificado e de cache.
4. Espere alguns minutos e teste os dois endereços.

Pronto. O sistema está no ar.

---

## O que fazer no primeiro dia de uso

1. Entre no painel e vá em **Ajustes**. Confira quantos alunos o estúdio atende
   ao mesmo tempo, a duração da sessão, o intervalo de recuperação, o horário e
   os dias de atendimento.
2. Ainda em Ajustes, cadastre os planos com os valores reais. Cada plano diz se
   a cobrança é **mensal**, **trimestral** ou **anual**, e o valor é sempre o do
   ciclo inteiro: em um trimestral, o valor dos três meses de uma vez. A tela
   mostra o equivalente por mês para você comparar planos.
3. Vá em **Alunos** e cadastre quem já treina. Para cada um, abra a ficha,
   preencha a saúde e defina o plano com o dia de vencimento. A ficha passa a
   mostrar o plano, a periodicidade e a data da próxima cobrança.
4. Vá em **Financeiro** e clique em **Gerar mensalidades**. O sistema cria a
   cobrança do mês para quem tem plano ativo **cujo ciclo cai naquele mês**.
   Quem está no meio de um trimestre ou de um ano já pago não recebe cobrança, e
   o aviso diz quantos ficaram de fora por esse motivo. Pode clicar de novo sem
   medo, ele não duplica.
5. Vá em **Agenda** e marque os treinos da semana.

## A rotina depois disso

- **Todo dia**, abra a tela **Hoje**. Ela mostra quem vem, quem está em atraso e
  quantos pedidos novos chegaram do site. Marque presença ou falta na hora.
- **Toda semana**, olhe o **Financeiro**. As abas separam o que está
  **pendente** (já venceu), o que é **próxima** (vence em até sete dias) e o
  restante em aberto. Pendente traz o botão **Cobrar** e próxima o botão
  **Lembrar**, os dois abrindo o WhatsApp com a mensagem já escrita.
- **Ao receber**, clique em **Recebi** e informe **como** o aluno pagou e **em
  que dia**. A data vem preenchida com hoje, mas dá para registrar um
  recebimento de ontem. Isso fica guardado no histórico de pagamentos, que você
  vê na aba **Histórico** do Financeiro e na ficha de cada aluno.
- **Todo começo de mês**, clique em **Gerar mensalidades**.
- **Quando chegar um pedido pelo site**, ele aparece em **Pedidos**. Dali dá
  para responder no WhatsApp e transformar em aluno com um clique.

---

## Cuidados importantes

**Cópia de segurança.** O sistema guarda dinheiro e ficha de saúde de gente. No
plano gratuito do Supabase não existe garantia de restaurar o banco de um dia
específico. Assim que o estúdio começar a usar de verdade, vale subir para o
plano pago do Supabase ou, no mínimo, baixar um backup do banco de tempos em
tempos, no menu Database, opção Backups.

**Dados de saúde.** Restrição médica, marca-passo e gravidez são dados sensíveis
pela LGPD. Por isso o acesso é só de quem tem login, e o aluno nunca aparece em
busca do Google. Não jogue esses dados em planilha compartilhada nem em grupo de
WhatsApp.

**Senhas.** Cada pessoa da equipe deve ter o próprio usuário. Para criar mais um,
repita a etapa 3 com outro e-mail, trocando `'dono'` por `'equipe'` na linha do
`insert into perfis`.

## Quando alguma coisa der errada

**O painel abre pedindo login e não entra.** Confira se o e-mail foi criado em
Authentication e se o arquivo 03 foi rodado com esse mesmo e-mail.

**Entra, mas dá erro ao carregar as telas.** Quase sempre é o arquivo
`02_permissoes.sql` que não rodou. Rode de novo.

**O painel abre com dados de exemplo.** O `config.js` está vazio ou foi
publicado sem preencher. Confira o arquivo que subiu para o GitHub.

**O formulário do site não gera pedido no painel.** Confira o `config.js` do
site, principalmente o `ESTUDIO_ID`. O WhatsApp continua abrindo mesmo assim,
então ninguém fica sem atendimento enquanto você resolve.

**Aparece erro falando da biblioteca do Supabase.** O painel carrega essa
biblioteca da internet. Sem conexão, ele não entra. Verifique a rede.
