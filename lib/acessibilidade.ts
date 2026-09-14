/**
 * Props para tornar um elemento não-interativo (`<div>`) utilizável como
 * botão, também por teclado.
 *
 * Há sítios na app onde o alvo clicável é um cartão inteiro — o mosaico do
 * painel, o cartão de um caso na lista, a linha de uma pergunta do diálogo.
 * Estavam todos como `<div onClick>`: funcionavam com o rato e eram
 * inalcançáveis por teclado, porque um `<div>` não entra na ordem de
 * tabulação nem reage a Enter/Espaço.
 *
 * Trocar por `<button>` era o ideal, mas nestes casos o conteúdo é um bloco
 * com títulos e parágrafos — um `<button>` à volta disso obriga a anular meia
 * dúzia de estilos herdados e, no cartão da lista de casos, aninharia
 * elementos interativos. Daí o par `role="button"` + `tabIndex`, com o mesmo
 * gesto de teclado que um botão nativo tem.
 */
export function propsAtivavel(aoAtivar: () => void) {
  return {
    role: "button",
    tabIndex: 0,
    onClick: aoAtivar,
    onKeyDown: (evento: React.KeyboardEvent) => {
      // Só quando a tecla é dirigida ao próprio elemento: sem isto, o Enter
      // num controlo lá dentro disparava também a ação do cartão.
      if (evento.target !== evento.currentTarget) return;
      if (evento.key !== "Enter" && evento.key !== " ") return;
      // O Espaço faz scroll da página por omissão; o Enter, num formulário,
      // submete.
      evento.preventDefault();
      aoAtivar();
    },
  };
}
