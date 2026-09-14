/**
 * Peso do desconto por falso positivo, em unidades de pontuação.
 *
 * A pontuação do plano e a das técnicas repartem-se por "unidades": cada
 * categoria aplicável (ou, no modelo oncológico, cada dimensão aplicável)
 * vale `100 / unidades`. Escolher uma categoria/técnica que não se aplica ao
 * caso desconta `PESO_FALSO_POSITIVO` unidades.
 *
 * Começou por ser 1 — peso simétrico, um erro a mais custava exatamente o que
 * valia um acerto. Funcionava como dissuasor, mas saturava: com 9 categorias
 * no total, qualquer caso com 3 ou menos categorias aplicáveis dava 0 a quem
 * ticasse tudo, e dava o mesmo 0 a quem ticasse tudo menos duas. Quem sabia
 * metade ficava indistinguível de quem não sabia nada.
 *
 * Com 0,5 o erro continua a doer — um único falso positivo tira metade do que
 * vale uma categoria certa — mas a escala volta a ter resolução no meio.
 *
 * Onde ainda satura: o desconto esgota a pontuação quando
 * `falsosPositivos >= unidades / PESO_FALSO_POSITIVO`, ou seja, ao dobro das
 * unidades. Num caso com 3 categorias aplicáveis em 9, ticar as 9 dá
 * exatamente 6 falsos positivos = 2 × 3, e cai em cima do piso de 0.
 */
export const PESO_FALSO_POSITIVO = 0.5;
