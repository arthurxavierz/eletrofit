# Eletrofit: auditoria e direção visual

## Auditoria inicial

- Stack: dois sites estáticos independentes, HTML/CSS/JS, sem build. Painel com ES modules, autenticação e dados via Supabase; demonstração em localStorage.
- Site: hero ocupa a tela inteira e esconde a próxima seção; marca reduzida ao símbolo; chamadas disputam espaço com cartões transparentes; tipografia e botões excessivamente condensados; cartões arredondados repetidos em método, benefícios e formulário.
- Fotos: apenas fachada, entrada e lateral reais. Não há fotos verificadas do interior, profissionais ou treino. Preservar essas imagens sem representar material de banco como sendo do estúdio.
- Navegação: menu mobile fechado continua contendo links focáveis; falta fechamento por Escape e indicação da seção ativa.
- Formulário público: WhatsApp e POST opcional para solicitações; aviso de privacidade contradiz gravação opcional; erros sem associação ao campo; falta alternativa explícita para reabrir a conversa.
- Painel: seis áreas completas (Hoje, Agenda, Alunos, Financeiro, Pedidos, Ajustes), além de ficha, planos, saúde, sessões e login. Controles pequenos no mobile, pouco contraste em textos secundários, muitos contornos e cartões aninhados.
- Janelas: não prendem/restauram foco, não fecham por Escape; confirmação substitui o formulário e pode deixar a promessa pendente ao fechar. Busca de alunos recria o campo a cada digitação e perde o foco.
- Banco: tabelas, autenticação, RLS e configuração de publicação revisados para delimitar contratos. A política anônima de solicitações consulta `estudios`, cuja leitura é restrita a autenticados; validar a inserção em ambiente Supabase antes de publicar. Não alterar permissões como parte de um redesign.

## Direção

Preto grafite, branco e amarelo elétrico. Anton para a marca e títulos do site; Manrope para leitura e toda a operação do painel. Tipos com tamanhos por breakpoint, sem tracking negativo. Superfícies planas, divisórias precisas, cantos de até 8px, espaço generoso no site e densidade prática no painel.

Hero fotográfico de ponta a ponta, Eletrofit como título, mensagem curta e um caminho claro para aula experimental. Método numerado, benefícios em linhas, galeria real ampliável, dúvidas, agendamento e localização. Animações de entrada e imagem respeitam redução de movimento. Navegação e conteúdo continuam disponíveis sem animação.

Preservar IDs, destinos, campos, contratos de dados, esquema SQL, configurações de hospedagem e todas as ações existentes. Testar a experiência em desktop e mobile e percorrer os fluxos no modo demonstração isolado.
