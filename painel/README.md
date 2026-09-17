# Painel Eletrofit

Sistema de gestão do estúdio: painel de números, agenda, alunos, ficha de
saúde, avaliação física, protocolos de treino, planos, mensalidades,
comunicação por WhatsApp, relatórios e os pedidos que chegam pelo site.

Feito em HTML, CSS e JavaScript puros. Não tem build, não tem framework e não
precisa de servidor próprio. É a mesma lógica do site: publicar a pasta já
coloca no ar. O banco de dados é o Supabase.

O visual é escuro, como a marca: fundo preto, texto claro, linhas finas. O ouro
da Eletrofit marca o que está selecionado e pinta os gráficos. Verde e vermelho
só quando significam alguma coisa, como pago, atrasado e falta, e sempre com a
palavra do lado, nunca só a cor.

Os gráficos são desenhados à mão em SVG, sem biblioteca externa. Usam um tom só,
do ouro claro ao ouro escuro, para nunca depender de o leitor distinguir cores
parecidas. Todo gráfico tem um botão **Ver números** que abre a mesma informação
em tabela.

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
│   └── 04_novas_tabelas.sql  Protocolos, avaliações, mensagens e metas
├── img/
│   └── eletrofit-raio.png
└── js/
    ├── app.js       Entrada e troca de tela
    ├── db.js        Todo o acesso aos dados
    ├── estado.js    Guarda quem está logado
    ├── graficos.js  Os gráficos em SVG
    ├── ui.js        Botões, formulários e janelas
    ├── util.js      Datas, dinheiro, telefone
    └── telas/       Um arquivo por tela do sistema
```

## As telas

| Tela | Para que serve |
| --- | --- |
| **Painel** | Números do mês, evolução de alunos, repartição por plano, mensalidades mês a mês, horários mais procurados, metas, agenda do dia e o que precisa de atenção. |
| **Hoje** | A operação do dia. Marca presença e falta na hora. |
| **Agenda** | A semana inteira, com a ocupação das vagas. |
| **Alunos** | Cadastro, busca, filtro por situação e ordenação. Mostra há quantos dias cada um não treina. |
| **Avaliações** | Peso, gordura, massa magra e medidas, com a evolução em gráfico. |
| **Treinos** | Os protocolos de eletroestimulação: frequência, largura de pulso, nível e como aplicar. |
| **Financeiro** | Mensalidades do mês, atrasos, baixa de pagamento e os últimos seis meses em gráfico. |
| **Planos** | O que o estúdio vende, quantos alunos em cada plano e de onde vem o faturamento. |
| **Pedidos** | Quem preencheu o formulário do site. Vira aluno com um clique. |
| **Comunicação** | Listas prontas de quem precisa receber mensagem e os textos padrão do estúdio. |
| **Relatórios** | Fechamento de três, seis ou doze meses: dinheiro, entradas, saídas, presença e quem mais falta. |
| **Ajustes** | Horário, capacidade, intervalo de recuperação e metas do mês. |

## Modo demonstração

Com o `config.js` vazio, o painel abre com dados de exemplo guardados no próprio
navegador. Serve para você clicar em tudo antes de configurar, e serve também
para mostrar o sistema pronto para um cliente novo sem precisar criar nada.

Basta abrir o `index.html` no navegador, ou servir a pasta:

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
4. Ainda não rode os arquivos 03 e 04. Eles são a próxima etapa, e a ordem
   importa: o 04 só funciona depois que o estúdio existir.

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
6. Agora sim, abra o arquivo `banco/04_novas_tabelas.sql`, cole no editor e
   clique em Run. Ele cria as tabelas de protocolos de treino, avaliações
   físicas e modelos de mensagem, liga as metas do mês e já deixa cinco
   protocolos e seis mensagens prontos no estúdio que você acabou de criar.

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
   os dias de atendimento. Aproveite e defina as metas do mês, elas viram barra
   de progresso no Painel.
2. Vá em **Planos** e cadastre os planos com os valores reais.
3. Vá em **Treinos** e confira os protocolos que já vieram prontos. Ajuste
   frequência, largura de pulso e descrição para o jeito do seu estúdio.
4. Vá em **Alunos** e cadastre quem já treina. Para cada um, abra a ficha,
   preencha a saúde e defina o plano com o dia de vencimento.
5. Vá em **Avaliações** e lance a medição de entrada de cada aluno. Sem a
   primeira medição não existe evolução para mostrar depois.
6. Vá em **Financeiro** e clique em **Gerar mensalidades**. O sistema cria a
   cobrança do mês para todo mundo que tem plano ativo. Pode clicar de novo sem
   medo, ele não duplica.
7. Vá em **Agenda** e marque os treinos da semana.
8. Passe em **Comunicação** e leia os modelos de mensagem. Mude o texto para a
   sua voz antes de começar a usar.

## A rotina depois disso

- **Todo dia**, abra a tela **Hoje**. Ela mostra quem vem, quem está em atraso e
  quantos pedidos novos chegaram do site. Marque presença ou falta na hora, e
  anote o protocolo aplicado.
- **Toda semana**, abra o **Painel** e olhe as listas de baixo: alunos sumidos,
  para cobrar e pedidos sem resposta. Depois passe em **Comunicação**, que junta
  todas essas listas com a mensagem pronta.
- **Todo começo de mês**, clique em **Gerar mensalidades** no Financeiro.
- **A cada dois meses**, lance uma nova medição em **Avaliações**. É o que
  transforma "acho que melhorei" em número.
- **No fechamento do mês**, abra **Relatórios**. Ali estão entradas, saídas,
  presença, quem mais treina e quem mais falta.

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
