import { formatRupiah } from '../../lib/format/formatters.ts';

export interface QuickCashOption {
  label: string;
  amount: number;
}

// Opsi cepat uang diterima (4 tombol, tidak pernah di bawah total, tanpa duplikat)
export function getQuickCashOptions(total: number): QuickCashOption[] {
  const buttons: QuickCashOption[] = [
    { label: 'Uang pas', amount: total },
  ];

  let nextAmounts: number[] = [];

  if (total <= 200000) {
    const roundedUp50k = Math.ceil(total / 50000) * 50000;
    const rawCandidates = [50000, 100000, 200000, roundedUp50k];

    const filtered = Array.from(new Set(rawCandidates))
      .filter((amt) => amt > total)
      .sort((a, b) => a - b);

    const fallbacks = [500000, 1000000].filter((amt) => amt > total);
    for (const fb of fallbacks) {
      if (filtered.length < 3 && !filtered.includes(fb)) {
        filtered.push(fb);
        filtered.sort((a, b) => a - b);
      }
    }

    nextAmounts = filtered.slice(0, 3);
  } else {
    const r50k = Math.ceil(total / 50000) * 50000;
    const r100k = Math.ceil(total / 100000) * 100000;
    const r500k = Math.ceil(total / 500000) * 500000;
    const r1M = Math.ceil(total / 1000000) * 1000000;
    const plus50k = total + 50000;

    const rawCandidates = [r50k, r100k, r500k, r1M, plus50k];

    const filtered = Array.from(new Set(rawCandidates))
      .filter((amt) => amt > total)
      .sort((a, b) => a - b);

    let extra = 1;
    while (filtered.length < 3) {
      const candidate = Math.ceil(total / 50000) * 50000 + extra * 50000;
      if (!filtered.includes(candidate)) {
        filtered.push(candidate);
        filtered.sort((a, b) => a - b);
      }
      extra++;
    }

    nextAmounts = filtered.slice(0, 3);
  }

  for (const amt of nextAmounts) {
    buttons.push({
      label: formatRupiah(amt),
      amount: amt,
    });
  }

  return buttons;
}
