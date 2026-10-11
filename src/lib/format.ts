export const money = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const storageLabel = (g: number) => (g >= 1000 ? `${g / 1000}TB` : `${g}GB`);

export const TAX = 0.13;
