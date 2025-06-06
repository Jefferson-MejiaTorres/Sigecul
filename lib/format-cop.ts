// Utilidad global para formatear valores en COP
export function formatCOP(value: string | number) {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "number" ? value : Number(value.toString().replace(/[^\d]/g, ""));
  if (isNaN(num)) return "";
  return num.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}