// Integración con open.er-api.com — gratuita, sin API key
// Convierte precios de MXN a USD en tiempo real

interface ExchangeRates {
  base:  string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

let cache: { data: ExchangeRates; fetchedAt: number } | null = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

export async function getExchangeRates(): Promise<ExchangeRates | null> {
  // Retornar caché si es válida
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ExchangeRates = await res.json();
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.error('[ExchangeRate] Error obteniendo tipo de cambio:', err);
    return null;
  }
}

export async function mxnToUsd(mxnAmount: number): Promise<number | null> {
  const rates = await getExchangeRates();
  if (!rates?.rates?.MXN) return null;

  const usd = mxnAmount / rates.rates.MXN;
  return Math.round(usd * 100) / 100;
}

export async function getUsdMxnRate(): Promise<number | null> {
  const rates = await getExchangeRates();
  return rates?.rates?.MXN ?? null;
}
