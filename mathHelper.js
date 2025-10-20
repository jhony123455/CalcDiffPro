export function formatExpression(expr, options = { pretty: true }) {
  const pretty = options.pretty !== false;

  if (!pretty) {
    // Versión "plain": limpiar espacios y devolver tal cual (útil para mostrar sqrt/exp tal como están)
    return expr.replace(/\s+/g, " ").trim().replace(/\*\*/g, "^"); // opcional: normalizar ** a ^
  }

  const superscripts = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

  // Convertir ^n a superíndice
  expr = expr.replace(/\^(\d+)/g, (_, p1) =>
    p1
      .split("")
      .map((d) => superscripts[parseInt(d)])
      .join("")
  );

  return expr
    .replace(/sqrt\((.*?)\)/g, "√($1)") // sqrt(x) → √(x)
    .replace(/exp\((.*?)\)/g, "e^($1)") // exp(x) → e^(x)
    .replace(/ln\((.*?)\)/g, "ln($1)") // ln(x) → ln(x)
    .replace(/log\((.*?)\)/g, "log($1)") // log(x) → log(x)
    .replace(/sin\((.*?)\)/g, "sin($1)") // sin(x)
    .replace(/cos\((.*?)\)/g, "cos($1)") // cos(x)
    .replace(/tan\((.*?)\)/g, "tan($1)"); // tan(x)
}
