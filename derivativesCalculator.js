import * as math from "mathjs";
import { formatExpression } from "./mathHelper";


/**
 * Calcula la derivada de una función y proporciona el paso a paso
 * @param {string} expression - Expresión matemática
 * @param {string} variable - Variable de derivación (generalmente 'x')
 * @param {number} order - Orden de la derivada (1 para primera, 2 para segunda, etc.)
 * @param {boolean} implicit - Si es derivación implícita
 * @returns {Object} Resultado con paso a paso
 */
export function calculateDerivative(
  expression,
  variable = "x",
  order = 1,
  implicit = false
) {
  const steps = [];
  let result = null;
  let rules = [];

  try {
    let cleanExpr = expression.replace(/^f\s*\(\s*x\s*\)\s*=\s*/, "").trim();
    if (!implicit && cleanExpr.includes("=")) {
      cleanExpr = cleanExpr.split("=").pop().trim();
    }

    // Paso 1: Expresión original
    steps.push({
      title: "Expresión original",
      content: implicit
        ? `Derivada implícita de: ${cleanExpr}`
        : `Derivar: f(${variable}) = ${cleanExpr}`,
      latex: implicit
        ? `\\frac{d}{d${variable}}[${cleanExpr}]`
        : `f(${variable}) = ${cleanExpr}`,
    });

    if (implicit) {
      // Derivación implícita
      const implicitResult = calculateImplicitDerivative(cleanExpr, variable);
      steps.push(...implicitResult.steps);
      result = implicitResult.result;
      rules = implicitResult.rules;
    } else {
      // Derivación explícita
      let currentExpr = cleanExpr;

      for (let i = 0; i < order; i++) {
        const derivativeResult = deriveExplicit(currentExpr, variable, i + 1);
        steps.push(...derivativeResult.steps);
        currentExpr = derivativeResult.result;
        rules.push(...derivativeResult.rules);

        if (i < order - 1) {
          steps.push({
            title: `Derivada de orden ${i + 1}`,
            content: `f${getSuperscript(i + 1)}(${variable}) = ${currentExpr}`,
            intermediate: true,
          });
        }
      }

      result = currentExpr;
    }

    // Paso final: Resultado
    const formattedResult = formatExpression(result);
    steps.push({
      title: "Resultado final",
      content: `f'(${variable}) = ${formattedResult}`,
      result: formattedResult,
      final: true,
    });
  } catch (error) {
    steps.push({
      title: "Error",
      content: `No se pudo calcular la derivada: ${error.message}`,
      error: true,
    });
  }

  return {
    result,
    steps,
    rules: [...new Set(rules)], // Eliminar duplicados
    expression,
    variable,
    order,
    implicit,
  };
}

/**
 * Deriva una expresión explícita
 */
function deriveExplicit(expression, variable, orderNum) {
  const steps = [];
  const rules = [];

  try {
    // Identificar la estructura de la expresión
    const structure = analyzeExpression(expression, variable);

    steps.push({
      title: `Análisis de la expresión ${orderNum > 1 ? `(derivada ${orderNum})` : ""}`,
      content: `Tipo de función: ${structure.type}`,
    });

    // Aplicar reglas de derivación según la estructura
    let derivative = null;

    if (structure.type === "sum") {
      rules.push("Regla de la suma");
      steps.push({
        title: "Aplicando regla de la suma",
        content: "(f + g)' = f' + g'",
      });
      derivative = deriveSumOrDifference(expression, variable, steps, rules);
    } else if (structure.type === "product") {
      rules.push("Regla del producto");
      steps.push({
        title: "Aplicando regla del producto",
        content: "(f · g)' = f' · g + f · g'",
      });
      derivative = deriveProduct(expression, variable, steps, rules);
    } else if (structure.type === "quotient") {
      rules.push("Regla del cociente");
      steps.push({
        title: "Aplicando regla del cociente",
        content: "(f/g)' = (f' · g - f · g') / g²",
      });
      derivative = deriveQuotient(expression, variable, steps, rules);
    } else if (structure.type === "chain") {
      rules.push("Regla de la cadena");
      steps.push({
        title: "Aplicando regla de la cadena",
        content: "(f(g(x)))' = f'(g(x)) · g'(x)",
      });
      derivative = deriveChain(expression, variable, steps, rules);
    } else if (structure.type === "power") {
      rules.push("Regla de la potencia");
      steps.push({
        title: "Aplicando regla de la potencia",
        content: "(x^n)' = n · x^(n-1)",
      });
      derivative = derivePower(expression, variable, steps, rules);
    } else {
      // Usar derivación simbólica de mathjs
      derivative = deriveWithMathJS(expression, variable, steps, rules);
    }

    // Simplificar el resultado
    const simplified = math.simplify(derivative);

    if (simplified.toString() !== derivative.toString()) {
      steps.push({
        title: "Simplificación",
        content: `${derivative} = ${simplified.toString()}`,
      });
    }

    return {
      result: simplified.toString(),
      steps,
      rules,
    };
  } catch (error) {
    // Fallback a mathjs
    return deriveWithMathJS(expression, variable, steps, rules);
  }
}

/**
 * Analiza la estructura de una expresión
 */
function analyzeExpression(expression, variable) {
  const expr = expression.trim();

  // Detectar suma/resta
  if (expr.includes("+") || (expr.includes("-") && !expr.startsWith("-"))) {
    return { type: "sum" };
  }

  // Detectar producto (pero no potencia)
  if (expr.includes("*") && !expr.includes("/") && !expr.includes("^")) {
    return { type: "product" };
  }

  // Detectar cociente
  if (expr.includes("/")) {
    return { type: "quotient" };
  }

  // Detectar potencia
  if (expr.includes("^")) {
    return { type: "power" };
  }

  // Detectar funciones compuestas (cadena)
  if (expr.match(/sin|cos|tan|log|ln|exp|sqrt/)) {
    return { type: "chain" };
  }

  return { type: "simple" };
}

/**
 * Deriva suma o diferencia
 */
function deriveSumOrDifference(expression, variable, steps, rules) {
  // Separar términos
  const terms = splitTerms(expression);

  steps.push({
    title: "Separación de términos",
    content: `Términos: ${terms.join(", ")}`,
  });

  // Derivar cada término
  const derivedTerms = terms.map((term) => {
    const termDerivative = math.derivative(term, variable).toString();
    steps.push({
      title: "Derivada de término",
      content: `d/d${variable}[${term}] = ${termDerivative}`,
    });
    return termDerivative;
  });

  return derivedTerms.join(" + ").replace(/\+ -/g, "- ");
}

/**
 * Deriva producto
 */
function deriveProduct(expression, variable, steps, rules) {
  // Intentar separar factores
  const factors = splitFactors(expression);

  if (factors.length === 2) {
    const [f, g] = factors;

    steps.push({
      title: "Identificación de factores",
      content: `f = ${f}\ng = ${g}`,
    });

    const fPrime = math.derivative(f, variable).toString();
    const gPrime = math.derivative(g, variable).toString();

    steps.push({
      title: "Derivadas de los factores",
      content: `f' = ${fPrime}\ng' = ${gPrime}`,
    });

    steps.push({
      title: "Aplicación de la fórmula",
      content: `f' · g + f · g' = (${fPrime}) · (${g}) + (${f}) · (${gPrime})`,
    });

    return `(${fPrime}) * (${g}) + (${f}) * (${gPrime})`;
  }

  // Fallback
  return math.derivative(expression, variable).toString();
}

/**
 * Deriva cociente
 */
function deriveQuotient(expression, variable, steps, rules) {
  const parts = expression.split("/");

  if (parts.length === 2) {
    const f = parts[0].trim().replace(/^\(|\)$/g, "");
    const g = parts[1].trim().replace(/^\(|\)$/g, "");

    steps.push({
      title: "Identificación de numerador y denominador",
      content: `f = ${f}\ng = ${g}`,
    });

    const fPrime = math.derivative(f, variable).toString();
    const gPrime = math.derivative(g, variable).toString();

    steps.push({
      title: "Derivadas del numerador y denominador",
      content: `f' = ${fPrime}\ng' = ${gPrime}`,
    });

    steps.push({
      title: "Aplicación de la fórmula",
      content: `(f' · g - f · g') / g² = ((${fPrime}) · (${g}) - (${f}) · (${gPrime})) / (${g})²`,
    });

    return `((${fPrime}) * (${g}) - (${f}) * (${gPrime})) / ((${g})^2)`;
  }

  return math.derivative(expression, variable).toString();
}

/**
 * Deriva composición (regla de la cadena)
 */
function deriveChain(expression, variable, steps, rules) {
  // Detectar función externa
  const funcMatch = expression.match(/(sin|cos|tan|log|ln|exp|sqrt)\((.+)\)/);

  if (funcMatch) {
    const outerFunc = funcMatch[1];
    const innerFunc = funcMatch[2];

    steps.push({
      title: "Identificación de funciones",
      content: `Función externa: ${outerFunc}\nFunción interna: g(${variable}) = ${innerFunc}`,
    });

    const innerDerivative = math.derivative(innerFunc, variable).toString();

    steps.push({
      title: "Derivada de la función interna",
      content: `g'(${variable}) = ${innerDerivative}`,
    });

    // Derivada de la función externa
    let outerDerivative = "";
    switch (outerFunc) {
      case "sin":
        outerDerivative = `cos(${innerFunc})`;
        rules.push("Derivada de seno");
        break;
      case "cos":
        outerDerivative = `-sin(${innerFunc})`;
        rules.push("Derivada de coseno");
        break;
      case "tan":
        outerDerivative = `sec(${innerFunc})^2`;
        rules.push("Derivada de tangente");
        break;
      case "ln":
      case "log":
        outerDerivative = `1/(${innerFunc})`;
        rules.push("Derivada de logaritmo");
        break;
      case "exp":
        outerDerivative = `exp(${innerFunc})`;
        rules.push("Derivada de exponencial");
        break;
      case "sqrt":
        outerDerivative = `1/(2*sqrt(${innerFunc}))`;
        rules.push("Derivada de raíz cuadrada");
        break;
    }

    steps.push({
      title: "Derivada de la función externa",
      content: `f'(g(${variable})) = ${outerDerivative}`,
    });

    steps.push({
      title: "Aplicación de la regla de la cadena",
      content: `f'(g(${variable})) · g'(${variable}) = (${outerDerivative}) · (${innerDerivative})`,
    });

    return `(${outerDerivative}) * (${innerDerivative})`;
  }

  return math.derivative(expression, variable).toString();
}

/**
 * Deriva potencia
 */
function derivePower(expression, variable, steps, rules) {
  const powerMatch = expression.match(/(.+)\^(.+)/);

  if (powerMatch) {
    const base = powerMatch[1].trim();
    const exponent = powerMatch[2].trim();

    steps.push({
      title: "Identificación de base y exponente",
      content: `Base: ${base}\nExponente: ${exponent}`,
    });

    // Si la base es la variable y el exponente es constante
    if (base === variable && !exponent.includes(variable)) {
      const n = exponent;
      const result = `${n} * ${variable}^(${n} - 1)`;

      steps.push({
        title: "Aplicación de la regla de la potencia",
        content: `n · x^(n-1) = ${n} · ${variable}^(${n} - 1)`,
      });

      return result;
    }

    // Si el exponente contiene la variable (derivación logarítmica)
    if (exponent.includes(variable)) {
      rules.push("Derivación logarítmica");
      steps.push({
        title: "Aplicando derivación logarítmica",
        content: `Para f(x)^g(x), usamos: (f^g)' = f^g · (g' · ln(f) + g · f'/f)`,
      });
    }
  }

  return math.derivative(expression, variable).toString();
}

/**
 * Deriva usando mathjs (fallback)
 */
function deriveWithMathJS(expression, variable, steps, rules) {
  const derivative = math.derivative(expression, variable);

  steps.push({
    title: "Derivación simbólica",
    content: `Aplicando reglas de derivación automáticas`,
  });

  return {
    result: derivative.toString(),
    steps,
    rules,
  };
}

/**
 * Derivación implícita robusta con despeje automático de y'
 */
/**
 * Derivación implícita mejorada - Maneja ecuaciones como 3y^2 + 25x = y^2 * 3x^3
 */
export function calculateImplicitDerivative(expression, variable = "x") {
  const steps = [];
  const rules = ["Derivación implícita", "Regla de la cadena para y"];

  steps.push({
    title: "Derivación implícita",
    content: `Se deriva ambos lados de la ecuación con respecto a ${variable}, recordando que y es función de ${variable}`,
  });

  try {
    // 1️⃣ Separar por el signo igual
    let [lhs, rhs] = expression.includes("=")
      ? expression.split("=").map((s) => s.trim())
      : [expression.trim(), "0"];

    steps.push({
      title: "Ecuación original",
      content: `${lhs} = ${rhs}`,
    });

    // 2️⃣ Derivar cada lado término por término
    const leftDerivative = deriveImplicitSide(lhs, variable, steps);
    const rightDerivative = deriveImplicitSide(rhs, variable, steps);

    steps.push({
      title: "Derivadas de ambos lados",
      content: `d/d${variable}[${lhs}] = ${leftDerivative}\n\nd/d${variable}[${rhs}] = ${rightDerivative}`,
    });

    // 3️⃣ Igualar ambas derivadas
    steps.push({
      title: "Ecuación derivada",
      content: `${leftDerivative} = ${rightDerivative}`,
    });

    // 4️⃣ Pasar todo al lado izquierdo
    const equation = `(${leftDerivative}) - (${rightDerivative})`;

    // 5️⃣ Simplificar
    let simplified;
    try {
      simplified = math.simplify(equation).toString();
    } catch {
      simplified = equation;
    }

    steps.push({
      title: "Simplificando",
      content: `${simplified} = 0`,
    });

    // 6️⃣ Despejar y' (yp)
    let result = null;
    try {
      // Reemplazar y' por yp para que math.js lo trate como variable
      const eqWithYp = simplified.replace(/y'/g, "yp");

      // Intentar resolver para yp
      const solutions = math.solve(eqWithYp, "yp");

      if (solutions) {
        const solution = Array.isArray(solutions) ? solutions[0] : solutions;
        result = solution.toString().replace(/yp/g, "y'");

        steps.push({
          title: "Despejando y'",
          content: `Aislamos y' de la ecuación y obtenemos:\n\ny' = ${result}`,
        });
      }
    } catch (e) {
      // Si no se puede despejar automáticamente, intentar manualmente
      result = manualSolveForYPrime(simplified, steps);
    }

    // 7️⃣ Resultado final
    const finalResult = result || simplified;

    steps.push({
      title: "Resultado final",
      content: result
        ? `dy/dx = ${result}`
        : `${simplified} = 0\n\n(No se pudo despejar y' automáticamente)`,
      final: true,
    });

    return {
      result: finalResult,
      steps,
      rules,
      implicit: true,
      variable,
    };
  } catch (error) {
    steps.push({
      title: "Error",
      content: `Error al calcular la derivada implícita: ${error.message}`,
      error: true,
    });

    return {
      result: "Error en derivación implícita",
      steps,
      rules,
      implicit: true,
      variable,
    };
  }
}

/**
 * Deriva un lado de la ecuación implícita término por término
 */
function deriveImplicitSide(expression, variable, steps) {
  // Dividir en términos (respetando paréntesis)
  const terms = splitTerms(expression);
  const derivedTerms = [];

  for (const term of terms) {
    const derived = deriveImplicitTerm(term, variable, steps);
    derivedTerms.push(derived);
  }

  return derivedTerms.join(" + ").replace(/\+ -/g, "- ");
}

/**
 * Deriva un término individual que puede contener y
 */
function deriveImplicitTerm(term, variable, steps) {
  const cleanTerm = term.trim();

  // Si el término contiene 'y', aplicar regla de la cadena
  if (cleanTerm.includes("y")) {
    // Casos especiales comunes

    // Caso: y^n
    const powerMatch = cleanTerm.match(/^(-?\d*\.?\d*)\*?y\^(\d+)$/);
    if (powerMatch) {
      const coef = powerMatch[1] || "1";
      const exp = powerMatch[2];
      const result = `${coef === "1" ? "" : coef + "*"}${exp}*y^${exp - 1}*y'`;

      steps.push({
        title: `Derivando término ${cleanTerm}`,
        content: `d/d${variable}[${cleanTerm}] = ${exp}*y^${exp - 1}*y' ${coef !== "1" ? `* ${coef}` : ""} = ${result}`,
      });

      return result;
    }

    // Caso: coef*y
    const linearMatch = cleanTerm.match(/^(-?\d*\.?\d*)\*?y$/);
    if (linearMatch) {
      const coef = linearMatch[1] || "1";
      const result = `${coef}*y'`;

      steps.push({
        title: `Derivando término ${cleanTerm}`,
        content: `d/d${variable}[${cleanTerm}] = ${result}`,
      });

      return result;
    }

    // Caso: producto con y (ej: y^2 * 3x^3)
    if (cleanTerm.includes("*")) {
      const factors = splitFactors(cleanTerm);

      // Identificar qué factores tienen y
      const yFactors = factors.filter((f) => f.includes("y"));
      const xFactors = factors.filter((f) => !f.includes("y"));

      if (yFactors.length > 0) {
        // Aplicar regla del producto
        const yPart = yFactors.join("*");
        const xPart = xFactors.join("*") || "1";

        const yDerivative = deriveImplicitTerm(yPart, variable, []);
        const xDerivative =
          xFactors.length > 0
            ? math.derivative(xPart, variable).toString()
            : "0";

        // (u*v)' = u'*v + u*v'
        const result = `(${yDerivative})*(${xPart}) + (${yPart})*(${xDerivative})`;

        steps.push({
          title: `Derivando producto ${cleanTerm}`,
          content: `Usando regla del producto:\nd/d${variable}[${yPart} * ${xPart}] = ${result}`,
        });

        return result;
      }
    }

    // Fallback: usar math.js con y como función
    try {
      const exprWithYx = cleanTerm.replace(/\by\b/g, "y(x)");
      const derivative = math.derivative(exprWithYx, variable).toString();
      const cleaned = derivative
        .replace(/d\(y\(x\)\)\/dx/g, "y'")
        .replace(/y\(x\)/g, "y");

      steps.push({
        title: `Derivando término ${cleanTerm}`,
        content: `d/d${variable}[${cleanTerm}] = ${cleaned}`,
      });

      return cleaned;
    } catch (e) {
      return cleanTerm + "*y'";
    }
  } else {
    // El término solo tiene x, derivar normalmente
    const derivative = math.derivative(cleanTerm, variable).toString();

    steps.push({
      title: `Derivando término ${cleanTerm}`,
      content: `d/d${variable}[${cleanTerm}] = ${derivative}`,
    });

    return derivative;
  }
}

/**
 * Intenta despejar y' manualmente de una ecuación
 */
function manualSolveForYPrime(equation, steps) {
  try {
    // Reemplazar y' por yp para manejar como variable
    const eqWithYp = equation.replace(/y'/g, "yp");

    let simplified = math.simplify(eqWithYp).toString();

    // Separar términos y clasificar en términos con yp y sin yp
    const terms = splitTerms(simplified);
    const ypTerms = [];
    const constantTerms = [];

    for (const term of terms) {
      if (term.includes("yp")) {
        // Obtener el coeficiente de yp reemplazándolo por 1 y simplificando
        let coef;
        try {
          coef = math.simplify(term.replace(/yp/g, "1")).toString();
        } catch {
          coef = term.replace(/yp/g, "1");
        }
        ypTerms.push(coef);
      } else {
        constantTerms.push(term);
      }
    }

    if (ypTerms.length > 0) {
      const ypCoefRaw =
        ypTerms.length === 1 ? ypTerms[0] : `(${ypTerms.join(" + ")})`;
      const constantRaw =
        constantTerms.length > 0 ? constantTerms.join(" + ") : "0";

      // Intentar simplificar numerador y denominador por separado para conservar la agrupación
      let ypCoefSimplified = ypCoefRaw;
      let constantSimplified = constantRaw;
      try {
        ypCoefSimplified = math.simplify(ypCoefRaw).toString();
      } catch (e) {
        /* mantener ypCoefRaw si falla */
      }
      try {
        constantSimplified = math.simplify(constantRaw).toString();
      } catch (e) {
        /* mantener constantRaw si falla */
      }

      // Construir resultado agrupado: -(constant) / (coef)
      const resultGrouped = `-(${constantSimplified})/(${ypCoefSimplified})`;

      // Mostrar con y' en lugar de yp
      const resultDisplay = resultGrouped.replace(/yp/g, "y'");

      steps.push({
        title: "Despeje manual de y'",
        content: `Factorizando y': ${ypCoefSimplified}*y' + (${constantSimplified}) = 0\n\ny' = ${resultDisplay}`,
      });

      return resultDisplay;
    }
  } catch (e) {
    console.error("Error en despeje manual:", e);
  }

  return null;
}

/**
 * Utilidades
 */
function splitTerms(expression) {
  // Separar por + y - manteniendo el signo
  const terms = [];
  let current = "";
  let parenLevel = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (char === "(") parenLevel++;
    if (char === ")") parenLevel--;

    if ((char === "+" || char === "-") && parenLevel === 0 && i > 0) {
      terms.push(current.trim());
      current = char === "-" ? "-" : "";
    } else {
      current += char;
    }
  }

  if (current) terms.push(current.trim());

  return terms.filter((t) => t.length > 0);
}

function splitFactors(expression) {
  // Separar por * manteniendo paréntesis
  const factors = [];
  let current = "";
  let parenLevel = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (char === "(") parenLevel++;
    if (char === ")") parenLevel--;

    if (char === "*" && parenLevel === 0) {
      factors.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current) factors.push(current.trim());

  return factors.filter((f) => f.length > 0);
}

function getSuperscript(n) {
  const superscripts = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  return n
    .toString()
    .split("")
    .map((d) => superscripts[parseInt(d)])
    .join("");
}

/**
 * Genera ejercicios aleatorios de derivadas
 */
export function generateRandomDerivative() {
  const types = [
    "polynomial",
    "product",
    "quotient",
    "chain",
    "trigonometric",
    "exponential",
    "logarithmic",
    "implicit",
  ];

  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case "polynomial":
      return generatePolynomialDerivative();
    case "product":
      return generateProductDerivative();
    case "quotient":
      return generateQuotientDerivative();
    case "chain":
      return generateChainDerivative();
    case "trigonometric":
      return generateTrigonometricDerivative();
    case "exponential":
      return generateExponentialDerivative();
    case "logarithmic":
      return generateLogarithmicDerivative();
    case "implicit":
      return generateImplicitDerivative();
    default:
      return generatePolynomialDerivative();
  }
}

function generatePolynomialDerivative() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const c = Math.floor(Math.random() * 10) + 1;

  return {
    expression: `${a}*x^3 + ${b}*x^2 + ${c}*x`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada de función polinomial",
  };
}

function generateProductDerivative() {
  const a = Math.floor(Math.random() * 5) + 1;
  const b = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `(${a}*x^2) * (${b}*x + 1)`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada usando regla del producto",
  };
}

function generateQuotientDerivative() {
  const a = Math.floor(Math.random() * 5) + 1;
  const b = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `(${a}*x + ${b}) / (x^2 + 1)`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada usando regla del cociente",
  };
}

function generateChainDerivative() {
  const functions = ["sin", "cos", "sqrt", "ln"];
  const func = functions[Math.floor(Math.random() * functions.length)];
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `${func}(${a}*x^2)`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada usando regla de la cadena",
  };
}

function generateTrigonometricDerivative() {
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `sin(${a}*x) * cos(x)`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada de función trigonométrica",
  };
}

function generateExponentialDerivative() {
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `exp(${a}*x)`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada de función exponencial",
  };
}

function generateLogarithmicDerivative() {
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `ln(${a}*x^2 + 1)`,
    variable: "x",
    order: 1,
    implicit: false,
    description: "Derivada de función logarítmica",
  };
}

function generateImplicitDerivative() {
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `x^2 + y^2 = ${a}`,
    variable: "x",
    order: 1,
    implicit: true,
    description: "Derivada implícita (círculo)",
  };
}
