# Eletrofit Estúdio

Site institucional de página única do Eletrofit Estúdio, em Patrocínio, Minas Gerais.
Estúdio de treino personalizado com colete de eletroestimulação muscular (EMS),
fisioterapia e reabilitação.

HTML, CSS e JavaScript puros, sem build, sem framework e sem dependência de
servidor. É só publicar a pasta.

Visual: grafite, branco e amarelo elétrico, com títulos em Anton e texto em
Manrope. Fotografias reais, seções abertas, método numerado, benefícios em
linhas e galeria ampliável. A mesma identidade aparece no painel de gestão.

---

O painel de gestão do estúdio fica em `painel`, com o passo a
passo de publicação no README de lá.

## Arquivos

```
site/
├── index.html      A página inteira, em seções
├── styles.css      Estilos. Base clara, acentos em ouro
├── script.js       Menu, galeria, mapa, animações, dúvidas e agenda da aula experimental
├── confirmar.html  Página que o aluno abre pelo link do WhatsApp para confirmar a aula
├── confirmar.js    Resposta Vou ou Não vou, com a regra do prazo vinda do banco
├── confirmar.css   Estilos só da página de confirmação
├── config.js       Ligação com o painel, opcional
├── favicon.png     Ícone da aba, recortado do raio da marca
└── img/
    ├── fachada-hero.jpg          Foto de topo, versão desktop
    ├── fachada-hero-mobile.jpg   Foto de topo, recorte vertical do celular
    ├── fachada-entrada.jpg       Fachada na seção do estúdio
    ├── fachada-lateral.jpg       Fachada na seção do estúdio
    ├── eletrofit-raio.png        Símbolo da marca
    └── og-eletrofit.jpg          Imagem de compartilhamento (WhatsApp, redes)
```

## Como abrir

Basta abrir o `index.html` no navegador. Para ver o comportamento igual ao da
publicação, sirva a pasta:

```bash
cd site
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Como publicar

Qualquer hospedagem de arquivos estáticos serve. No Netlify, a pasta de publicação
é `site` e não existe comando de build. Em domínio próprio, aponte o
DNS e envie os arquivos da pasta como estão.

---

## Seções da página

| Seção | O que faz |
| --- | --- |
| Topo | Foto da fachada, marca em destaque, chamada e aula experimental |
| Método | Quatro passos, da avaliação ao acompanhamento |
| Benefícios | Seis ganhos da eletroestimulação, em uma linha cada |
| Estúdio | Fotos reais com ampliação, setas de navegação e legendas |
| Dúvidas | Quatro perguntas, incluindo contraindicações |
| Agendar | Agenda com os dias e horários livres, dados de contato e envio do pedido |
| Contato | Telefone, Instagram, horário, rota e mapa sob demanda |

A barra de navegação tem dois estados. Sobre a foto do topo ela é invisível: só o
logotipo, os links em branco e o botão de aula experimental, sem fundo e sem
borda. Ao passar do topo, ela vira uma barra preta fixa, mais baixa, com as
escritas em branco. A troca é feita por IntersectionObserver, no `script.js`.
No celular ela vira logotipo mais menu, com o painel também escuro.

A agenda mostra as próximas três semanas de atendimento. Cada dia diz quantos
horários estão livres e, ao escolher o dia, aparecem os horários da manhã, tarde e
noite. Com o `config.js` preenchido, a ocupação vem do painel pela função
`agenda_publica` do banco, que devolve só os horários tomados, nunca nomes. Um
pedido novo já segura o horário, para dois visitantes não escolherem o mesmo. Com
o `config.js` vazio, a agenda usa o horário padrão do estúdio, todos livres, e o
pedido segue pelo WhatsApp. Se a agenda estiver desligada em Ajustes, o formulário
volta a pedir só o período.

Com o painel ligado, o pedido é gravado e a pessoa vê a confirmação na hora, com
um botão opcional para falar no WhatsApp. Se a gravação falhar, o WhatsApp abre
com a mensagem pronta, então ninguém fica sem atendimento.

O formulário antigo tinha quatro campos (nome, celular, objetivo e período). Ele valida,
associa os erros aos campos, foca o primeiro erro e abre o WhatsApp com a mensagem
pronta. Um link alternativo permite continuar se o navegador bloquear a nova aba.

## Movimento

O topo monta o nome letra por letra, com uma faísca no FIT e uma linha de pulso
elétrico que atravessa a foto. A foto desce mais devagar que a página ao rolar.
Uma barra amarela no alto mostra quanto da página já foi lida. Os títulos ganham
um marca-texto amarelo quando aparecem, o método tem um trilho que enche com a
rolagem, os benefícios acendem onde o mouse passa, as fotos abrem como cortina, a
chamada amarela tem raios correndo e as dúvidas abrem deslizando. Os botões
principais seguem de leve o mouse.

Tudo isso desliga com a preferência de redução de movimento do sistema, e o
conteúdo continua inteiro, parado.

A galeria usa um diálogo nativo, aceita as setas do teclado e fecha com Escape.
O menu fechado fica fora da navegação por teclado. As animações respeitam a
preferência de redução de movimento. O mapa do Google só carrega ao clicar em
"Ver mapa da região"; o link externo de rota funciona independentemente dele.

Se o arquivo `config.js` estiver preenchido com os dados do Supabase, o mesmo
envio também registra o pedido no painel, na tela de Pedidos, e a proprietária
vê o contato mesmo que a conversa se perca no WhatsApp. Com o `config.js` vazio,
o site funciona exatamente como antes e nada é gravado.

---

## Dados do negócio usados no site

| Dado | Valor |
| --- | --- |
| WhatsApp e telefone | (34) 99120-8519 |
| Endereço | Av. Jacinto Barbosa, 622, São Francisco, Patrocínio, MG, 38740-000 |
| Horário | 07h às 20h30 |
| Instagram | @eletrofit.studio |
| Tecnologia | Colete de eletroestimulação WiemsPro |

Para trocar o número de WhatsApp, altere a constante `WHATS` no `script.js` e os
links `wa.me` no `index.html`. O número vai com DDI, sem sinais: `5534991208519`.

---

## Fotos

As imagens são fotos reais da fachada, feitas no fim de tarde, recortadas e
comprimidas para web. Para trocar qualquer uma, mantenha o nome do arquivo e uma
proporção parecida:

- `fachada-hero.jpg`, horizontal, algo perto de 1450 por 1300
- `fachada-hero-mobile.jpg`, vertical, algo perto de 900 por 1600
- `fachada-entrada.jpg` e `fachada-lateral.jpg`, verticais, perto de 900 por 990

Fotos do treino, do colete e da sala renderiam ainda mais. Quando existirem, os
melhores lugares são a seção do método e a seção do estúdio.

O logotipo e o ícone foram recortados da foto de perfil do Instagram. Se existir
o arquivo original em vetor, vale substituir os dois por ele.

## O que ainda depende do estúdio

Pontos deixados sem número no texto, para não publicar informação que não veio do
cliente:

- Duração da sessão.
- Valores e planos. A página leva para o WhatsApp em vez de mostrar tabela.
- Atendimento aos sábados. O horário publicado cobre segunda a sexta.
- Nome e registro do profissional responsável, caso queiram assinar a página.
