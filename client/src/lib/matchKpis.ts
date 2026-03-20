export const AUTO_PERCENT_IF_TRUE = 100;
export const AUTO_PERCENT_IF_FALSE = 0;

const isProvidedNumber = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value);

export const resolvePctJogosMarcou = (
  goalsFor: number,
  pctJogosMarcou?: number
) => {
  if (isProvidedNumber(pctJogosMarcou)) return pctJogosMarcou;
  return goalsFor > 0 ? AUTO_PERCENT_IF_TRUE : AUTO_PERCENT_IF_FALSE;
};

export const resolvePctNaoSofreu = (
  goalsAgainst: number,
  pctNaoSofreu?: number
) => {
  if (isProvidedNumber(pctNaoSofreu)) return pctNaoSofreu;
  return goalsAgainst === 0 ? AUTO_PERCENT_IF_TRUE : AUTO_PERCENT_IF_FALSE;
};
