# Eletrofit Estúdio

Site institucional de página única do Eletrofit Estúdio, em Patrocínio, Minas Gerais.
Estúdio de treino personalizado com colete de eletroestimulação muscular (EMS),
fisioterapia e reabilitação.

HTML, CSS e JavaScript puros, sem build, sem framework e sem dependência de
servidor. É só publicar a pasta.

Visual: base branca, texto preto e o ouro da marca nos detalhes. As fotos da
fachada à noite entram como blocos escuros, em contraste com o branco da página.

---

O painel de gestão do estúdio fica em `painel`, com o passo a
passo de publicação no README de lá.

## Arquivos

```
site/
├── index.html      A página inteira, em seções
├── styles.css      Estilos. Base clara, acentos em ouro
├── script.js       Menu, animações de entrada, dúvidas e envio ao WhatsApp
├── config.js       Ligação com o painel, opcional
├── favicon.png     Ícone da aba, recortado do raio da marca
└── img/
    ├── fachada-hero.jpg          Foto de topo, versão desktop
    ├── fachada-hero-mobile.jpg   Foto de topo, recorte vertical do celular
    ├── fachada-entrada.jpg       Fachada na seção do estúdio
    ├── fachada-lateral.jpg       Fachada na seção do estúdio
    ├── eletrofit-logo.png        Logotipo em círculo, fundo transparente
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
| Topo | Foto da fachada, chamada principal e dois cartões de destaque |
| Método | Quatro passos, da avaliação ao acompanhamento |
| Benefícios | Seis ganhos da eletroestimulação, em uma linha cada |
| Estúdio | Fotos da fachada e três pontos sobre a estrutura |
| Dúvidas | Quatro perguntas, incluindo contraindicações |
| Agendar | Formulário que monta a mensagem e abre o WhatsApp |
| Contato | Telefone, Instagram, horário e mapa |

A barra de navegação tem dois estados. Sobre a foto do topo ela é invisível: só o
logotipo, os links em branco e o botão de aula experimental, sem fundo e sem
borda. Ao passar do topo, ela vira uma barra preta fixa, mais baixa, com as
escritas em branco. A troca é feita por IntersectionObserver, no `script.js`.
No celular ela vira logotipo mais menu, com o painel também escuro.

O formulário tem quatro campos (nome, celular, objetivo e período). Ele valida,
monta o texto e abre o WhatsApp do estúdio com a mensagem pronta.

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
