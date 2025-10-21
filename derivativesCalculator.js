import * as math from "mathjs";

const derivativeCache = new Map();

function normalizeMathExpression(expr) {
  return expr.replace(/^f\s*\(\s*x\s*\)\s*=\s*/, "").trim();
}

export function calculateDerivative(
  expression,
  variable = "x",
  order = 1,
  implicit = false
) {
  const cacheKey = `${expression}|${variable}|${order}|${implicit}`;
  if (derivativeCache.has(cacheKey)) {
    return derivativeCache.get(cacheKey);
  }

  const steps = [];
  let result = null;
  let rules = [];

  try {
    let cleanExpr = normalizeMathExpression(expression);
    if (!implicit && cleanExpr.includes("=")) {
      cleanExpr = cleanExpr.split("=").pop().trim();
    }

    steps.push({
      title: "Expresión original",
      content: implicit
        ? `Derivada implícita de: ${cleanExpr}`
        : `Derivar: f(${variable}) = ${cleanExpr}`,
    });

    if (implicit) {
      const implicitResult = calculateImplicitDerivative(cleanExpr, variable);
      steps.push(...implicitResult.steps);
      result = implicitResult.result;
      rules = implicitResult.rules;
    } else {
      let currentExpr = cleanExpr;
      for (let i = 0; i < order; i++) {
        const derivativeResult = math.derivative(currentExpr, variable);

        // 🔹 Simplificamos completamente antes de continuar
        const simplified = math.simplify(derivativeResult);

        // 🔹 Convertimos a string limpio
        currentExpr = simplified.toString();

        // 🔹 Guardamos el paso intermedio
        steps.push({
          title: `Derivada de orden ${i + 1}`,
          content: `f${getSuperscript(i + 1)}(${variable}) = ${currentExpr}`,
          intermediate: i < order - 1,
        });
      }

      // 🔹 Último paso: simplificar el resultado final otra vez
      result = math.simplify(currentExpr).toString();
    }

    const finalResult = {
      result,
      steps: [
        ...steps,
        {
          title: "Resultado final",
          content: `f${getSuperscript(order)}(${variable}) = ${result}`,
          final: true,
        },
      ],
      rules: [...new Set(rules)],
      expression,
      variable,
      order,
      implicit,
    };

    derivativeCache.set(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    const errorResult = {
      result: null,
      steps: [
        ...steps,
        {
          title: "Error",
          content: `No se pudo calcular la derivada: ${error.message}`,
          error: true,
        },
      ],
      rules: [],
      expression,
      variable,
      order,
      implicit,
    };
    return errorResult;
  }
}

export function calculateImplicitDerivative(expression, variable = "x") {
  const steps = [];
  const rules = ["Derivación implícita", "Regla de la cadena para y"];

  try {
    let [lhs, rhs] = expression.includes("=")
      ? expression.split("=").map((s) => s.trim())
      : [expression.trim(), "0"];

    steps.push({
      title: "Ecuación original",
      content: `${lhs} = ${rhs}`,
    });

    // Usar math.js directamente para derivación implícita
    const leftDerivative = deriveSideWithMathJS(
      lhs,
      variable,
      steps,
      "izquierdo"
    );
    const rightDerivative = deriveSideWithMathJS(
      rhs,
      variable,
      steps,
      "derecho"
    );

    steps.push({
      title: "Derivadas de ambos lados",
      content: `d/d${variable}[${lhs}] = ${leftDerivative}\nd/d${variable}[${rhs}] = ${rightDerivative}`,
    });

    // Crear ecuación: leftDerivative - rightDerivative = 0
    const equation = `(${leftDerivative}) - (${rightDerivative})`;

    // Simplificar la ecuación
    let simplifiedEquation;
    try {
      simplifiedEquation = math.simplify(equation).toString();
    } catch (error) {
      simplifiedEquation = equation;
    }

    steps.push({
      title: "Ecuación derivada",
      content: `${simplifiedEquation} = 0`,
    });

    // Resolver para y'
    const result = solveForYPrime(simplifiedEquation, steps);

    if (result && result !== "Error") {
      steps.push({
        title: "Resultado final",
        content: `dy/dx = ${result}`,
        final: true,
      });
      return { result, steps, rules, implicit: true, variable };
    } else {
      steps.push({
        title: "Resultado",
        content: `Ecuación derivada: ${simplifiedEquation} = 0`,
        final: true,
      });
      return {
        result: simplifiedEquation,
        steps,
        rules,
        implicit: true,
        variable,
      };
    }
  } catch (error) {
    steps.push({
      title: "Error",
      content: `Error en derivación implícita: ${error.message}`,
      error: true,
    });
    return {
      result: "Error",
      steps,
      rules,
      implicit: true,
      variable,
    };
  }
}

function deriveSideWithMathJS(expression, variable, steps, sideName) {
  try {
    // Paso 1: separa términos de la expresión
    const terms = expression.split(/(?=[+-])/);

    const derivedTerms = terms.map((term) => {
      term = term.trim();

      if (term.includes("y")) {
        // Aplica regla de la cadena para y
        // Deriva como si y fuera símbolo
        const termY = term.replace(/\by\b(?!\()/g, "Y");
        const dTerm = math.derivative(termY, variable).toString();

        // Si no depende de x, entonces deriva con respecto a y y multiplica por y'
        const dependsOnX = term.includes(variable);
        if (!dependsOnX) {
          // ejemplo: y^2 -> 2*y*y'
          const powerMatch = term.match(/y\^(\d+)/);
          if (powerMatch) {
            const power = parseInt(powerMatch[1]);
            return `${power}*y^${power - 1}*y'`;
          } else {
            return `y'`;
          }
        }
        return dTerm.replace(/Y/g, "y");
      } else {
        // Deriva normalmente con respecto a x
        const dTerm = math.derivative(term, variable);
        return dTerm.toString();
      }
    });

    const result = derivedTerms.join(" + ");

    steps.push({
      title: `Derivando lado ${sideName}`,
      content: `d/d${variable}[${expression}] = ${result}`,
    });

    return result;
  } catch (error) {
    throw new Error(`No se pudo derivar: ${expression}`);
  }
}

function solveForYPrime(equation, steps) {
  try {
    // Reemplazar y' por una variable temporal para resolver
    const equationWithTempVar = equation.replace(/y'/g, "YP");

    // Intentar resolver usando math.js
    const solutions = math.solve(equationWithTempVar, "YP");

    if (solutions && solutions.length > 0) {
      let solution = Array.isArray(solutions) ? solutions[0] : solutions;
      solution = solution.toString().replace(/YP/g, "y'");

      steps.push({
        title: "Solución para y'",
        content: `Resolviendo: ${equationWithTempVar.replace(/YP/g, "y'")} = 0\ny' = ${solution}`,
      });

      return solution;
    }

    // Si math.js no puede resolver, intentar método manual simple
    return solveForYPrimeManual(equation, steps);
  } catch (error) {
    // Fallback a método manual
    return solveForYPrimeManual(equation, steps);
  }
}
function solveForYPrimeManual(equation, steps) {
  try {
    // quitar "= 0" si existe
    const cleanEquation = equation.replace(/\s*=\s*0\s*$/, "").trim();

    // usar variable temporal YP en lugar de y'
    const exprYP = cleanEquation.replace(/y'/g, "YP");

    if (!/YP/.test(exprYP)) {
      return "No se encontró y' en la ecuación";
    }

    // Intentar obtener coeficiente de YP: derivada parcial respecto a YP
    let coef;
    try {
      coef = math.simplify(math.derivative(exprYP, "YP")).toString();
    } catch (e) {
      coef = null;
    }

    // Obtener parte constante (poner YP = 0)
    let constTerm;
    try {
      constTerm = math.simplify(exprYP.replace(/YP/g, "0")).toString();
    } catch (e) {
      constTerm = null;
    }

    if (!coef || coef === "0") {
      steps.push({
        title: "No lineal en y'",
        content: `No se pudo obtener un coeficiente lineal de y' (coeficiente = ${coef}).`,
      });
      return "No lineal";
    }

    const resultExpr = `-(${constTerm})/(${coef})`;
    const resultDisplay = resultExpr.replace(/YP/g, "y'");

    steps.push({
      title: "Despejando y' manualmente",
      content:
        `Sustituimos y' por YP: ${exprYP}\n` +
        `Coeficiente de YP: ${coef}\n` +
        `Término constante (YP=0): ${constTerm}\n\n` +
        `Resolviendo: YP = ${resultExpr}\n` +
        `y' = ${resultDisplay}`,
    });

    return resultDisplay;
  } catch (error) {
    steps.push({
      title: "Error despejando y'",
      content: `No se pudo despejar y' de la ecuación: ${equation}`,
    });
    return "Error";
  }
}

function combineTerms(terms) {
  const nonZeroTerms = terms.filter((term) => term !== "0" && term !== "");

  if (nonZeroTerms.length === 0) return "0";
  if (nonZeroTerms.length === 1) return nonZeroTerms[0];

  return `(${nonZeroTerms.join(" + ")})`;
}

function splitTerms(expression) {
  const terms = [];
  let currentTerm = "";
  let parenLevel = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (char === "(") parenLevel++;
    if (char === ")") parenLevel--;

    if (parenLevel === 0 && (char === "+" || char === "-") && i > 0) {
      if (currentTerm.trim() !== "") {
        terms.push(currentTerm.trim());
      }
      currentTerm = char === "-" ? "-" : "";
    } else {
      currentTerm += char;
    }
  }

  if (currentTerm.trim() !== "") {
    terms.push(currentTerm.trim());
  }

  return terms.filter((term) => term !== "" && term !== " " && term !== "()");
}

function getSuperscript(n) {
  const superscripts = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  return n
    .toString()
    .split("")
    .map((d) => superscripts[parseInt(d)])
    .join("");
}

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

  const generators = {
    polynomial: () => ({
      expression: `${Math.floor(Math.random() * 10) + 1}*x^3 + ${Math.floor(Math.random() * 10) + 1}*x^2 + ${Math.floor(Math.random() * 10) + 1}*x`,
      variable: "x",
      order: 1,
      implicit: false,
      description: "Derivada de función polinomial",
    }),
    product: () => ({
      expression: `(${Math.floor(Math.random() * 5) + 1}*x^2) * (${Math.floor(Math.random() * 5) + 1}*x + 1)`,
      variable: "x",
      order: 1,
      implicit: false,
      description: "Derivada usando regla del producto",
    }),
    quotient: () => ({
      expression: `(${Math.floor(Math.random() * 5) + 1}*x + ${Math.floor(Math.random() * 5) + 1}) / (x^2 + 1)`,
      variable: "x",
      order: 1,
      implicit: false,
      description: "Derivada usando regla del cociente",
    }),
    chain: () => {
      const functions = ["sin", "cos", "sqrt", "ln"];
      const func = functions[Math.floor(Math.random() * functions.length)];
      return {
        expression: `${func}(${Math.floor(Math.random() * 5) + 1}*x^2)`,
        variable: "x",
        order: 1,
        implicit: false,
        description: "Derivada usando regla de la cadena",
      };
    },
    trigonometric: () => ({
      expression: `sin(${Math.floor(Math.random() * 5) + 1}*x) * cos(x)`,
      variable: "x",
      order: 1,
      implicit: false,
      description: "Derivada de función trigonométrica",
    }),
    exponential: () => ({
      expression: `exp(${Math.floor(Math.random() * 5) + 1}*x)`,
      variable: "x",
      order: 1,
      implicit: false,
      description: "Derivada de función exponencial",
    }),
    logarithmic: () => ({
      expression: `ln(${Math.floor(Math.random() * 5) + 1}*x^2 + 1)`,
      variable: "x",
      order: 1,
      implicit: false,
      description: "Derivada de función logarítmica",
    }),
    implicit: () => ({
      expression: `x^2 + y^2 = ${Math.floor(Math.random() * 5) + 1}`,
      variable: "x",
      order: 1,
      implicit: true,
      description: "Derivada implícita (círculo)",
    }),
  };

  return generators[type]();
}
