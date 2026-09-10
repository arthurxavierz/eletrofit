# Eletrofit Estúdio

Site e sistema de gestão do Eletrofit Estúdio, em Patrocínio, Minas Gerais.
Estúdio de treino personalizado com colete de eletroestimulação muscular (EMS),
fisioterapia e reabilitação.

Duas pastas, dois endereços, o mesmo repositório:

| Pasta | O que é | Quem usa |
| --- | --- | --- |
| `site/` | Site público, o link da bio | Quem procura o estúdio |
| `painel/` | Sistema de gestão, protegido por login | A proprietária e a equipe |

Tudo em HTML, CSS e JavaScript puros. Sem build, sem framework, sem servidor
próprio. Publicar a pasta já coloca no ar. O banco de dados é o Supabase.

---

## Site

Página única com a apresentação do estúdio, o método, os benefícios, as fotos da
fachada, as dúvidas frequentes e o formulário de agendamento. O formulário abre o
WhatsApp com a mensagem pronta e, quando configurado, também registra o pedido no
painel.

Detalhes em [site/README.md](site/README.md).

## Painel

Agenda com controle de capacidade, alunos com ficha de saúde, planos,
mensalidades e os pedidos que chegam pelo site. Feito para o celular em primeiro
lugar, que é como a agenda é usada de verdade.

Com o `config.js` vazio, o painel abre em modo demonstração, com dados de exemplo
guardados no próprio navegador. Serve para conhecer o sistema antes de configurar
qualquer coisa, e para apresentar a um cliente novo.

O passo a passo completo de publicação, do Supabase ao domínio, está em
[painel/README.md](painel/README.md).

---

## Como publicar, em resumo

1. Crie o projeto no Supabase e rode os três arquivos de `painel/banco`.
2. Crie o usuário da proprietária e ligue ao estúdio.
3. Preencha `painel/config.js` e `site/config.js` com as chaves do Supabase.
4. No Netlify, crie dois sites a partir deste repositório. Um publica a pasta
   `site`, o outro publica a pasta `painel`. Nenhum dos dois tem comando de build.
5. Aponte o domínio no Cloudflare, com os registros em DNS only.

O passo a passo detalhado está em [painel/README.md](painel/README.md).

## Dados do estúdio

| Dado | Valor |
| --- | --- |
| WhatsApp e telefone | (34) 99120-8519 |
| Endereço | Av. Jacinto Barbosa, 622, São Francisco, Patrocínio, MG, 38740-000 |
| Horário | 07h às 20h30 |
| Instagram | @eletrofit.studio |
| Tecnologia | Colete de eletroestimulação WiemsPro |
