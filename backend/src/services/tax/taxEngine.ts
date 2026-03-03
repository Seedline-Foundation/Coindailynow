export type TaxCountryCode = 'NG' | 'GH' | 'KE' | 'ZA' | 'EG' | 'UG' | 'TZ' | 'MA' | 'SN' | 'CI';
export type CostBasisMethod = 'FIFO' | 'LIFO' | 'HIFO';

export type TaxTxType =
  | 'BUY'
  | 'SELL'
  | 'TRANSFER'
  | 'STAKING_REWARD'
  | 'MINING'
  | 'AIRDROP'
  | 'FEE';

export type TaxTransactionInput = {
  txType: TaxTxType;
  asset: string;
  quantity: number;
  priceUsd?: number; // per-unit price at timestamp (required for SELL/INCOME)
  feeUsd?: number;
  timestamp: string; // ISO
};

export type TaxRules = {
  countryCode: TaxCountryCode;
  taxYear: number;
  capitalGainsRate: number; // 0-1
  incomeRate: number; // 0-1
  costBasisDefault: CostBasisMethod;
};

type Lot = {
  acquiredAt: number;
  qty: number;
  costPerUnitUsd: number;
};

export type TaxCalculationResult = {
  countryCode: TaxCountryCode;
  taxYear: number;
  costBasis: CostBasisMethod;
  totals: {
    capitalGainsUsd: number;
    capitalLossesUsd: number;
    incomeUsd: number;
    netCapitalUsd: number;
    taxDueUsd: number;
  };
  disposals: Array<{
    asset: string;
    timestamp: string;
    quantity: number;
    proceedsUsd: number;
    costBasisUsd: number;
    gainUsd: number;
    feeUsd: number;
  }>;
  warnings: string[];
  suggestions: string[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function safeNum(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseTs(ts: string): number {
  const d = new Date(ts);
  const t = d.getTime();
  return Number.isFinite(t) ? t : NaN;
}

export function getDefaultRules(countryCode: TaxCountryCode, taxYear: number): TaxRules {
  // Blueprint Feature 09 — all 10 African countries
  const base = countryCode.toUpperCase() as TaxCountryCode;

  const ruleMap: Record<TaxCountryCode, { cg: number; inc: number }> = {
    NG: { cg: 0.10,  inc: 0.10  }, // Nigeria — 10% CGT
    GH: { cg: 0.25,  inc: 0.25  }, // Ghana — 25% CGT (corrected from 15%)
    KE: { cg: 0.15,  inc: 0.03  }, // Kenya — 15% CGT + 3% Digital Asset Tax
    ZA: { cg: 0.18,  inc: 0.45  }, // South Africa — effective 18% inclusion CGT, up to 45% income
    EG: { cg: 0.00,  inc: 0.00  }, // Egypt — no official crypto tax framework yet
    UG: { cg: 0.00,  inc: 0.30  }, // Uganda — no specific CGT, general income rate ~30%
    TZ: { cg: 0.00,  inc: 0.00  }, // Tanzania — crypto officially banned, no tax
    MA: { cg: 0.00,  inc: 0.00  }, // Morocco — banned 2017, regulation pending
    SN: { cg: 0.10,  inc: 0.25  }, // Senegal — WAEMU framework, general income rates apply
    CI: { cg: 0.10,  inc: 0.25  }, // Côte d'Ivoire — WAEMU framework
  };

  const rates = ruleMap[base] || ruleMap.NG;
  return { countryCode: base, taxYear, capitalGainsRate: rates.cg, incomeRate: rates.inc, costBasisDefault: 'FIFO' };
}

function pickLots(lots: Lot[], method: CostBasisMethod): Lot[] {
  if (method === 'FIFO') return [...lots].sort((a, b) => a.acquiredAt - b.acquiredAt);
  if (method === 'LIFO') return [...lots].sort((a, b) => b.acquiredAt - a.acquiredAt);
  // HIFO
  return [...lots].sort((a, b) => b.costPerUnitUsd - a.costPerUnitUsd);
}

export function calculateTax(
  rules: TaxRules,
  transactions: TaxTransactionInput[],
  costBasisMethod?: CostBasisMethod
): TaxCalculationResult {
  const costBasis = costBasisMethod || rules.costBasisDefault;
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const perAssetLots = new Map<string, Lot[]>();
  const disposals: TaxCalculationResult['disposals'] = [];

  let capitalGainsUsd = 0;
  let capitalLossesUsd = 0;
  let incomeUsd = 0;

  const sorted = [...transactions].sort((a, b) => parseTs(a.timestamp) - parseTs(b.timestamp));

  for (const tx of sorted) {
    const asset = String(tx.asset || '').toUpperCase().trim();
    const qty = safeNum(tx.quantity);
    const fee = Math.max(0, safeNum(tx.feeUsd));
    const ts = parseTs(tx.timestamp);
    if (!asset) {
      warnings.push('Skipped transaction with missing asset');
      continue;
    }
    if (!Number.isFinite(ts)) {
      warnings.push(`Skipped ${asset} transaction with invalid timestamp`);
      continue;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      warnings.push(`Skipped ${asset} transaction with invalid quantity`);
      continue;
    }

    const lots = perAssetLots.get(asset) || [];

    if (tx.txType === 'BUY') {
      const price = safeNum(tx.priceUsd, NaN);
      if (!Number.isFinite(price) || price <= 0) {
        warnings.push(`BUY for ${asset} missing/invalid priceUsd; using 0 cost basis`);
      }
      lots.push({ acquiredAt: ts, qty, costPerUnitUsd: Number.isFinite(price) ? price : 0 });
      perAssetLots.set(asset, lots);
      continue;
    }

    if (tx.txType === 'STAKING_REWARD' || tx.txType === 'MINING' || tx.txType === 'AIRDROP') {
      const price = safeNum(tx.priceUsd, NaN);
      if (!Number.isFinite(price) || price <= 0) {
        warnings.push(`${tx.txType} for ${asset} missing/invalid priceUsd; income treated as 0`);
      }
      const income = Number.isFinite(price) ? qty * price : 0;
      incomeUsd += income;
      // Income assets enter inventory at FMV
      lots.push({ acquiredAt: ts, qty, costPerUnitUsd: Number.isFinite(price) ? price : 0 });
      perAssetLots.set(asset, lots);
      continue;
    }

    if (tx.txType === 'TRANSFER') {
      // Non-taxable, no change in cost basis in this simplified model
      perAssetLots.set(asset, lots);
      continue;
    }

    if (tx.txType === 'SELL') {
      const price = safeNum(tx.priceUsd, NaN);
      if (!Number.isFinite(price) || price <= 0) {
        warnings.push(`SELL for ${asset} missing/invalid priceUsd; proceeds treated as 0`);
      }
      const proceeds = (Number.isFinite(price) ? qty * price : 0) - fee;

      // Consume lots
      let remaining = qty;
      let costBasisUsd = 0;
      const ordered = pickLots(lots, costBasis);

      for (const lot of ordered) {
        if (remaining <= 0) break;
        if (lot.qty <= 0) continue;
        const take = Math.min(remaining, lot.qty);
        remaining -= take;
        lot.qty -= take;
        costBasisUsd += take * lot.costPerUnitUsd;
      }

      // Persist updated lot quantities back into the original lots array
      // (ordered contains references to same lot objects)
      const cleaned = lots.filter(l => l.qty > 1e-12);
      perAssetLots.set(asset, cleaned);

      if (remaining > 1e-9) {
        warnings.push(`SELL for ${asset} exceeds available inventory by ${round2(remaining)} units; missing lots treated as 0 cost basis`);
      }

      const gain = proceeds - costBasisUsd;
      if (gain >= 0) capitalGainsUsd += gain;
      else capitalLossesUsd += Math.abs(gain);

      disposals.push({
        asset,
        timestamp: new Date(ts).toISOString(),
        quantity: qty,
        proceedsUsd: round2(proceeds),
        costBasisUsd: round2(costBasisUsd),
        gainUsd: round2(gain),
        feeUsd: round2(fee),
      });
      continue;
    }

    if (tx.txType === 'FEE') {
      // Treated as expense; if provided as USD fee, it will be included elsewhere
      continue;
    }
  }

  const netCapitalUsd = capitalGainsUsd - capitalLossesUsd;
  const taxDueUsd = Math.max(0, netCapitalUsd) * rules.capitalGainsRate + incomeUsd * rules.incomeRate;

  if (capitalLossesUsd > 0 && netCapitalUsd > 0) {
    suggestions.push('You have both gains and losses; ensure losses are applied to offset gains within your jurisdiction rules.');
  }
  if (capitalLossesUsd > capitalGainsUsd) {
    suggestions.push('Net capital losses detected; consider carry-forward rules (jurisdiction dependent).');
  }

  return {
    countryCode: rules.countryCode,
    taxYear: rules.taxYear,
    costBasis,
    totals: {
      capitalGainsUsd: round2(capitalGainsUsd),
      capitalLossesUsd: round2(capitalLossesUsd),
      incomeUsd: round2(incomeUsd),
      netCapitalUsd: round2(netCapitalUsd),
      taxDueUsd: round2(taxDueUsd),
    },
    disposals,
    warnings,
    suggestions,
  };
}
