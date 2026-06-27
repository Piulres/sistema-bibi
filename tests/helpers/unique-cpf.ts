/** Gera CPF válido único por seed — evita colisão entre runs em test.db. */
export function uniqueTestCpf(seed = Date.now()): string {
  const base = String(seed % 1_000_000_000).padStart(9, "0");
  const nums = base.split("").map(Number);

  const checksum = (digits: number[], factor: number): number => {
    const sum = digits.reduce((acc, d, i) => acc + d * (factor - i), 0);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = checksum(nums, 10);
  const d2 = checksum([...nums, d1], 11);
  return `${base}${d1}${d2}`;
}
