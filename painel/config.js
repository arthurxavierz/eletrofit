/* ===================================================
   Eletrofit, configuracao do painel

   Enquanto os dois primeiros campos estiverem vazios,
   o painel abre em modo demonstracao, com dados de
   exemplo guardados no proprio navegador. Nada e
   enviado para lugar nenhum.

   Para ligar no banco de verdade, preencha os tres
   campos abaixo com os dados do seu projeto Supabase.
   Estao em Project Settings, API.
   =================================================== */

export const CONFIG = {
  // Project URL. Exemplo: https://abcdefgh.supabase.co
  SUPABASE_URL: "",

  // Chave publica anon. Pode ficar no codigo, ela sozinha
  // nao da acesso a nada por causa das regras do banco.
  SUPABASE_ANON_KEY: "",

  // ID do estudio, mostrado ao rodar o arquivo 03_primeiro_acesso.sql
  ESTUDIO_ID: "",
};
