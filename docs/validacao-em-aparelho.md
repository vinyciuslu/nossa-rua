# Roteiro de validação em aparelho real

O que os testes automáticos **não** cobrem (ver "Limitações conhecidas" no README). Ideal: um iPhone (Safari) e um Android (Chrome), de preferência com uma pessoa que já use leitor de tela ou ícones grandes no dia a dia. Anote o resultado de cada linha: ✅ ok, ⚠️ funciona com ressalva, ❌ falha (com o que aconteceu).

Preparação: abrir o endereço do app no celular, entrar como morador(a) de demonstração e, se necessário, usar "Configurações → Relógio de demonstração" para avançar o tempo.

## 1. Leitor de tela (VoiceOver no iPhone, TalkBack no Android)

| #   | O que fazer                                      | O que esperar                                                                           | Resultado |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------- | --------- |
| 1.1 | Percorrer o Início deslizando para a direita     | Cada publicação é lida com tipo, título, bairro, tempo e status; nenhum item "sem nome" |           |
| 1.2 | Trocar de aba (Início → Estado → Mapa)           | O leitor passa a ler o conteúdo novo, não a aba antiga; o título da tela é anunciado    |           |
| 1.3 | Apoiar um relato                                 | Estado do botão (apoiado / não apoiado) é lido; mensagem de confirmação é anunciada     |           |
| 1.4 | Relatar um problema, com um campo inválido       | O erro é lido junto ao campo; o foco não se perde                                       |           |
| 1.5 | Abrir o histórico de um relato                   | A linha do tempo é lida em ordem, com o selo "simulado" onde houver                     |           |
| 1.6 | Mapa: usar só as listas de trechos e de ônibus   | Todas as informações estão nas listas, sem precisar tocar no mapa                       |           |
| 1.7 | Painel `/admin` (computador, com NVDA/VoiceOver) | Navegação, filtros e formulário de status utilizáveis só com teclado                    |           |

## 2. Modo de toque duplo

| #   | O que fazer                                          | O que esperar                                                                    | Resultado |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------------- | --------- |
| 2.1 | Ligar em Acessibilidade e tocar uma vez em "Estado"  | Voz diz "Estado, link. Toque de novo para abrir."; item destacado; tela não muda |           |
| 2.2 | Tocar de novo no mesmo item                          | Abre a tela                                                                      |           |
| 2.3 | Tocar uma vez, esperar ~5 s, tocar de novo           | Volta a ser "primeiro toque"                                                     |           |
| 2.4 | Tocar num campo de texto e digitar                   | Fala o nome do campo; o teclado abre e dá para escrever                          |           |
| 2.5 | Com VoiceOver/TalkBack **ligado junto**              | Os dois não brigam (o leitor de tela ativa direto); se atrapalhar, anotar        |           |
| 2.6 | Desligar o modo                                      | Toque duas vezes em "Desligado"; instrução da tela é suficiente?                 |           |
| 2.7 | A voz em português está clara e na velocidade certa? | Anotar o aparelho e a voz usada                                                  |           |

Pergunta para quem usa: o destaque (contorno grosso) e a frase falada bastam, ou falta algo (vibração, repetir a última frase)?

## 3. Aparência e toque

| #   | O que fazer                                                                          | O que esperar                                                        | Resultado |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | --------- |
| 3.1 | Ícones grandes ligados, em tela de ~360 px                                           | Nada corta nem sai da tela; áreas de toque confortáveis              |           |
| 3.2 | Cada modo de cor (padrão, vermelho-verde, azul-amarelo, alto contraste), ao ar livre | Status e níveis de trânsito distinguíveis **sem depender só da cor** |           |
| 3.3 | Fonte do sistema aumentada                                                           | Layout continua legível, sem rolagem horizontal                      |           |
| 3.4 | Girar o aparelho (paisagem)                                                          | Usável; moldura de celular não aparece                               |           |
| 3.5 | Modo escuro do sistema                                                               | Anotar se algo fica ilegível (o app não tem tema escuro próprio)     |           |

## 4. Recursos do aparelho

| #   | O que fazer                                  | O que esperar                                                                                                                                   | Resultado |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 4.1 | Relatar com foto: câmera e galeria           | Foto entra, é reduzida e a prévia aparece; a foto salva **não** traz localização (EXIF)                                                         |           |
| 4.2 | Teclado virtual ao preencher o relato        | O campo focado não fica escondido atrás do teclado                                                                                              |           |
| 4.3 | Evento: "Adicionar à agenda" (.ics)          | Abre no app de calendário com título "[Demonstração] …", data e hora certas (fuso de São Paulo)                                                 |           |
| 4.4 | Evento/relato: "Compartilhar"                | Abre a folha de compartilhamento do sistema; o texto não afirma nada oficial                                                                    |           |
| 4.5 | Mapa: arrastar, pinçar, rolar a página       | Com dois dedos move o mapa; com um dedo a página rola; zoom funciona                                                                            |           |
| 4.6 | Mapa com internet                            | **Imagens de ruas do OpenStreetMap aparecem** atrás dos trechos (nunca foi visto em desenvolvimento) e os trechos continuam legíveis sobre elas |           |
| 4.7 | Mapa sem internet (modo avião, depois abrir) | Aviso de que o mapa-base não carregou; listas continuam completas                                                                               |           |
| 4.8 | Fechar e reabrir o navegador                 | Sessão, preferências e publicações continuam                                                                                                    |           |
| 4.9 | Navegação privativa                          | Aviso de que dados não serão lembrados aparece                                                                                                  |           |

## 5. Desempenho percebido

| #   | O que fazer                   | O que esperar                                                                           | Resultado |
| --- | ----------------------------- | --------------------------------------------------------------------------------------- | --------- |
| 5.1 | Abrir o app com rede 4G fraca | Primeira tela em poucos segundos; telas seguintes mostram "Carregando" em vez de branco |           |
| 5.2 | Trocar de tela repetidamente  | Sem travar; rolagem fluida no Início                                                    |           |

## Como devolver o resultado

Cole a tabela preenchida (ou foto/vídeo de qualquer ❌) na conversa, informando modelo do aparelho, versão do sistema e navegador. Cada ❌ vira um ajuste; cada ⚠️ vira uma decisão sua (ajustar ou registrar como limitação).
