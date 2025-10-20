import { create, all } from "mathjs";
import { formatExpression } from "./mathHelper";

// ======================================================
// === MANEJO ROBUSTO DE LÍMITES AL INFINITO (AST) =====
// ======================================================

/**
 * Analiza el límite al infinito simbólicamente usando el AST de math.js
 * para cocientes de polinomios. Devuelve pasos + resultado o null si no aplica.
 */
function handleInfinityLimit(expression, variable, point) {
  try {
    const node = math.parse(expression);
    if (node.type !== "OperatorNode" || node.op !== "/") return null;

    const numerator = node.args[0];
    const denominator = node.args[1];

    const numInfo = analyzePolynomialAST(numerator, variable);
    const denInfo = analyzePolynomialAST(denominator, variable);

    if (!numInfo || !denInfo) return null;

    const { degree: degNum, coeff: coeffNum } = numInfo;
    const { degree: degDen, coeff: coeffDen } = denInfo;

    const steps = [];
    const latex = [];
    steps.push({
      title: "Análisis del límite al infinito",
      content:
        `Identificamos los grados de numerador y denominador.\n\n` +
        `Numerador: ${formatExpression(numerator.toString(), { pretty: false })} (grado ${degNum})\n` +
        `Denominador: ${formatExpression(denominator.toString(), { pretty: false })} (grado ${degDen})`,
      latex: `\\deg(N)=${degNum},\\quad \\deg(D)=${degDen}`,
    });

    const maxDeg = Math.max(degNum, degDen);
    latex.push(
      `\\frac{${toLatex(numerator)}}{${toLatex(denominator)}} = ` +
        `\\frac{\\frac{${toLatex(numerator)}}{${variable}^{${maxDeg}}}}{\\frac{${toLatex(denominator)}}{${variable}^{${maxDeg}}}}`
    );

    steps.push({
      title: "División por la potencia dominante",
      content: `Dividimos numerador y denominador entre ${variable}<sup>${maxDeg}</sup> para analizar su comportamiento al infinito.`,
      latex: `\\displaystyle ${latex.join(" ")}`,
    });

    let result;
    if (degNum === degDen) {
      result = coeffNum / coeffDen;
      steps.push({
        title: "Grados iguales",
        content: `El límite es el cociente de los coeficientes líderes: ${coeffNum}/${coeffDen} = ${result}`,
        latex: `\\frac{${coeffNum}}{${coeffDen}} = ${result}`,
      });
    } else if (degNum < degDen) {
      result = 0;
      steps.push({
        title: "Grado menor en el numerador",
        content: `El grado del numerador (${degNum}) es menor que el del denominador (${degDen}), por lo tanto el límite es 0.`,
      });
    } else {
      const sign = Math.sign(coeffNum / coeffDen);
      result = sign >= 0 ? Infinity : -Infinity;
      steps.push({
        title: "Grado mayor en el numerador",
        content: `El grado del numerador (${degNum}) es mayor que el del denominador (${degDen}), el límite tiende a ${result}.`,
      });
    }

    return { steps, result, method: "Cociente de polinomios (AST simbólico)" };
  } catch (err) {
    console.error("Error en handleInfinityLimit robusto:", err);
    return null;
  }
}

/**
 * Analiza un nodo AST y devuelve grado y coeficiente líder si es polinomio.
 */
function analyzePolynomialAST(node, variable) {
  // Expandimos la expresión (para obtener suma de términos)
  const expanded = math.simplify(node, {}, { expand: true });

  // Convertir a árbol para analizar términos
  const terms = expandAddTerms(expanded);

  let maxDegree = -Infinity;
  let leadingCoeff = 0;

  for (const term of terms) {
    const info = analyzeTerm(term, variable);
    if (info && info.degree >= maxDegree) {
      maxDegree = info.degree;
      leadingCoeff = info.coeff;
    }
  }

  if (maxDegree === -Infinity) return null;
  return { degree: maxDegree, coeff: leadingCoeff };
}

/**
 * Descompone una suma (o un solo término) en sus sumandos.
 */
function expandAddTerms(node) {
  if (node.type === "OperatorNode" && node.op === "+") {
    return [...expandAddTerms(node.args[0]), ...expandAddTerms(node.args[1])];
  } else if (node.type === "OperatorNode" && node.op === "-") {
    // convertir resta en suma de término negativo
    return [...expandAddTerms(node.args[0]), math.multiply(-1, node.args[1])];
  } else {
    return [node];
  }
}

/**
 * Analiza un solo término del polinomio: coeficiente y grado en variable.
 */
function analyzeTerm(node, variable) {
  if (node.type === "SymbolNode") {
    return node.name === variable
      ? { degree: 1, coeff: 1 }
      : { degree: 0, coeff: 0 };
  }

  if (node.type === "ConstantNode") {
    return { degree: 0, coeff: parseFloat(node.value) };
  }

  if (node.type === "OperatorNode" && node.op === "*") {
    // Buscar multiplicación de constante y potencia
    let coeff = 1;
    let degree = 0;
    for (const arg of node.args) {
      const termInfo = analyzeTerm(arg, variable);
      coeff *= termInfo.coeff;
      degree += termInfo.degree;
    }
    return { coeff, degree };
  }

  if (node.type === "OperatorNode" && node.op === "^") {
    if (
      node.args[0].name === variable &&
      node.args[1].type === "ConstantNode"
    ) {
      return { coeff: 1, degree: parseInt(node.args[1].value, 10) };
    }
  }

  // Multiplicaciones implícitas (e.g., 3x)
  if (node.type === "OperatorNode" && node.op === "implicit") {
    return analyzeTerm(math.parse(node.toString()), variable);
  }

  // Si no es reconocible como término polinómico
  return null;
}

/** Devuelve el LaTeX de un nodo */
function toLatex(node) {
  try {
    return node.toTex({ parenthesis: "keep", implicit: "hide" });
  } catch {
    return node.toString();
  }
}

const math = create(all);

/**
 * Calcula el límite de una función y proporciona el paso a paso
 * @param {string} expression - Expresión matemática
 * @param {string} variable - Variable (generalmente 'x')
 * @param {number|string} point - Punto al que tiende (puede ser un número o 'infinity' o '-infinity')
 * @returns {Object} Resultado con paso a paso
 */
export function calculateLimit(expression, variable = "x", point = 0) {
  const steps = [];
  let result = null;
  let indetermination = null;
  let factorizationMethod = null;

  try {
    // Paso 1: Expresión original
    steps.push({
      title: "Expresión original",
      content: `lim (${variable} → ${point}) ${formatExpression(expression, { pretty: false })}`,
      latex: `\\lim_{${variable} \\to ${point}} ${expression}`,
    });

    // Compilar la expresión
    const compiledExpr = math.compile(expression);

    // Paso 2: Evaluación directa
    let directEval = null;
    try {
      // Caso: infinito (existente)
      if (
        point === "infinity" ||
        point === Infinity ||
        point === "-infinity" ||
        point === -Infinity
      ) {
        const symbolicResult = handleInfinityLimit(expression, variable, point);
        if (symbolicResult) {
          steps.push(...symbolicResult.steps);
          result = symbolicResult.result;
        } else {
          // Si no es una fracción de polinomios, usa el método numérico
          const numeric = evaluateAtInfinity(
            compiledExpr,
            variable,
            point === "infinity" || point === Infinity
          );
          if (isFinite(numeric) && !isNaN(numeric)) {
            steps.push({
              title: "Evaluación numérica (verificación)",
              content: `El resultado aproximado al evaluar con valores grandes de ${variable} es ${numeric}`,
              result: `${numeric}`,
            });
            result = numeric;
          } else {
            throw new Error("Indeterminación detectada");
          }
        }
      } else {
        // Nuevo: evaluación directa para puntos finitos
        const scope = {};
        scope[variable] = Number(point);
        const val = compiledExpr.evaluate(scope);

        steps.push({
          title: "Evaluación directa",
          content: `Evaluando en ${variable} = ${point}: ${val}`,
          result: `${val}`,
        });

        // Si la evaluación devuelve número finito, usamos ese resultado
        if (isFinite(val) && !isNaN(val)) {
          result = val;
        } else {
          // Forzar manejo de indeterminación más abajo
          throw new Error("Indeterminación detectada");
        }
      }
    } catch (e) {
      // Detectar tipo de indeterminación
      indetermination = detectIndetermination(expression, variable, point);

      steps.push({
        title: "Indeterminación detectada",
        content: `Al evaluar directamente obtenemos una indeterminación del tipo: ${indetermination}`,
        alert: true,
      });

      // Paso 3: Resolver indeterminación
      const resolution = resolveIndetermination(
        expression,
        variable,
        point,
        indetermination
      );

      if (resolution) {
        steps.push(...resolution.steps);
        result = resolution.result;
        factorizationMethod = resolution.method;
      }
    }

    // Paso final: Resultado
    if (result !== null) {
      steps.push({
        title: "Resultado final",
        content: `El límite es: ${result}`,
        result: result,
        final: true,
      });
    }
  } catch (error) {
    steps.push({
      title: "Error",
      content: `No se pudo calcular el límite: ${error.message}`,
      error: true,
    });
  }

  return {
    result,
    steps,
    indetermination,
    factorizationMethod,
    expression,
    variable,
    point,
  };
}

/**
 * Detecta el tipo de indeterminación
 */
function detectIndetermination(expression, variable, point) {
  try {
    const compiledExpr = math.compile(expression);
    const scope = {};

    // Evaluar en puntos cercanos
    const epsilon = 0.0001;
    let leftValue, rightValue;

    if (point === "infinity" || point === Infinity) {
      scope[variable] = 1000000;
      leftValue = compiledExpr.evaluate(scope);
      return "∞/∞ o ∞-∞";
    } else if (point === "-infinity" || point === -Infinity) {
      scope[variable] = -1000000;
      leftValue = compiledExpr.evaluate(scope);
      return "∞/∞ o ∞-∞";
    } else {
      const numPoint = parseFloat(point);

      // Evaluar por la izquierda
      scope[variable] = numPoint - epsilon;
      leftValue = compiledExpr.evaluate(scope);

      // Evaluar por la derecha
      scope[variable] = numPoint + epsilon;
      rightValue = compiledExpr.evaluate(scope);

      if (isNaN(leftValue) || isNaN(rightValue)) {
        return "0/0";
      }

      if (!isFinite(leftValue) && !isFinite(rightValue)) {
        return "∞/∞";
      }
    }

    return "0/0";
  } catch (e) {
    return "0/0";
  }
}

/**
 * Resuelve la indeterminación aplicando técnicas algebraicas
 */
function resolveIndetermination(expression, variable, point, indetermination) {
  const steps = [];
  let result = null;
  let method = null;

  // Intentar factorización para 0/0
  if (indetermination === "0/0") {
    // Verificar si es una fracción
    if (expression.includes("/")) {
      const parts = expression.split("/");
      if (parts.length === 2) {
        const numerator = parts[0].trim().replace(/^\(|\)$/g, "");
        const denominator = parts[1].trim().replace(/^\(|\)$/g, "");

        steps.push({
          title: "Identificación de numerador y denominador",
          content: `Numerador: ${formatExpression(numerator, { pretty: false })}\nDenominador: ${formatExpression(denominator, { pretty: false })}`,
        });

        // Intentar factorización por diferencia de cuadrados
        const diffSquares = tryDifferenceOfSquares(
          numerator,
          denominator,
          variable,
          point
        );
        if (diffSquares) {
          method = "Diferencia de cuadrados";
          steps.push({
            title: "Aplicando diferencia de cuadrados",
            content: `Se identifica que el numerador puede factorizarse como diferencia de cuadrados: a² - b² = (a+b)(a-b)`,
          });
          steps.push(...diffSquares.steps);
          result = diffSquares.result;
        } else {
          // Intentar factorización común
          const commonFactor = tryCommonFactorization(
            numerator,
            denominator,
            variable,
            point
          );
          if (commonFactor) {
            method = "Factorización común";
            steps.push({
              title: "Aplicando factorización",
              content: `Se factoriza el numerador y denominador para cancelar términos comunes`,
            });
            steps.push(...commonFactor.steps);
            result = commonFactor.result;

            if (radicalLimit) {
              method = "Racionalización de radicales";
              steps.push({
                title: "Aplicando racionalización",
                content: `Se detecta un radical en el numerador, se multiplica por el conjugado y se simplifica`,
              });
              steps.push(...radicalLimit.steps);
              result = radicalLimit.result;
            }
          } else {
            // Intentar L'Hôpital (aproximación numérica)
            method = "Aproximación numérica (Regla de L'Hôpital)";
            const lhopital = applyLHopitalNumerically(
              expression,
              variable,
              point
            );
            steps.push({
              title: "Aplicando aproximación numérica",
              content: `Se calcula el límite evaluando valores muy cercanos al punto`,
            });
            steps.push(...lhopital.steps);
            result = lhopital.result;
          }
        }
      }
    } else {
      // No es una fracción, intentar simplificación directa
      method = "Simplificación algebraica";
      const simplified = simplifyExpression(expression, variable, point);
      steps.push(...simplified.steps);
      result = simplified.result;
    }
  } else if (indetermination.includes("∞")) {
    // Para indeterminaciones con infinito
    method = "Límite al infinito";
    const infLimit = evaluateInfinityLimit(expression, variable, point);
    steps.push(...infLimit.steps);
    result = infLimit.result;
  }

  return {
    steps,
    result,
    method,
  };
}

/**
 * Intenta resolver por diferencia de cuadrados
 */
/**
 * Intenta resolver límites 0/0 por diferencia de cuadrados correctamente
 */
function tryDifferenceOfSquares(numerator, denominator, variable, point) {
  const steps = [];
  try {
    // Paso 1: Simplificar numerador y denominador
    const numSimplified = math.simplify(numerator).toString();
    const denSimplified = math.simplify(denominator).toString();

    steps.push({
      title: "Simplificación inicial",
      content: `Numerador simplificado: ${formatExpression(numSimplified, { pretty: false })}\nDenominador simplificado: ${formatExpression(denSimplified, { pretty: false })}`,
    });

    // Normalizar espacios para facilitar matching (mathjs puede devolver "x ^ 2")
    const normNum = numSimplified.replace(/\s+/g, "");
    // Detectar patrón a^2 - b (b puede ser c o d^2)
    const diffSquaresPattern = /^(.+?)\^2-(.+)$/;
    const match = normNum.match(diffSquaresPattern);

    if (match) {
      const aRaw = match[1].trim();
      const bRaw = match[2].trim();

      // Reconstruir a y b en forma legible para mathjs (mantener paréntesis si hacen falta)
      const a = aRaw.includes("(") ? aRaw : aRaw;
      let b;
      // Si b es una potencia (algo^2)
      const powMatch = bRaw.match(/^(.+)\^2$/);
      if (powMatch) {
        b = powMatch[1].trim();
      } else if (/^[+-]?\d+(\.\d+)?$/.test(bRaw)) {
        // Si b es constante numérica, tomar su raíz cuadrada si es exacta, sino usar sqrt(...)
        const num = Number(bRaw);
        const root = Math.sqrt(num);
        b = Number.isInteger(root) ? `${root}` : `sqrt(${num})`;
      } else {
        b = `(${bRaw})`;
      }

      steps.push({
        title: "Factorización de diferencia de cuadrados",
        content: `Se factoriza ${formatExpression(numSimplified, { pretty: false })} = (${a} + ${b})(${a} - ${b})`,
      });

      // Fracción factorizada
      const factoredExpr = `(${a} + ${b})*(${a} - ${b})/(${denSimplified})`;
      const simplified = math.simplify(factoredExpr);

      steps.push({
        title: "Simplificación de la fracción",
        content: `Fracción factorizada y simplificada: ${formatExpression(simplified.toString(), { pretty: false })}`,
      });

      // Evaluar en el punto; si denSimplified contiene la cancelación, la simplificación la reflejará
      const scope = { [variable]: parseFloat(point) };
      const result = simplified.evaluate(scope);

      steps.push({
        title: "Evaluación en el punto",
        content: `Sustituyendo ${variable} = ${point}, el límite es ${result}`,
      });

      return { steps, result };
    }

    return null;
  } catch (error) {
    console.error("Error en tryDifferenceOfSquares:", error);
    return null;
  }
}
/**
 * Intenta factorización común
 */
function tryCommonFactorization(numerator, denominator, variable, point) {
  try {
    const steps = [];

    // Intentar simplificación directa con mathjs
    const simplified = math.simplify(`(${numerator}) / (${denominator})`);

    steps.push({
      title: "Simplificación algebraica",
       content: `Expresión simplificada: ${formatExpression(simplified.toString(), { pretty: false })}`,
    });

    const scope = {};
    scope[variable] = parseFloat(point);
    const result = simplified.evaluate(scope);

    if (isFinite(result) && !isNaN(result)) {
      steps.push({
        title: "Evaluación después de simplificar",
        content: `Sustituyendo ${variable} = ${point}: ${result}`,
      });

      return { steps, result };
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Aplica L'Hôpital numéricamente
 */
function applyLHopitalNumerically(expression, variable, point) {
  const steps = [];
  const compiledExpr = math.compile(expression);
  const numPoint = parseFloat(point);

  // Evaluar en puntos muy cercanos
  const epsilon = 0.00001;
  const scope = {};

  scope[variable] = numPoint + epsilon;
  const rightValue = compiledExpr.evaluate(scope);

  scope[variable] = numPoint - epsilon;
  const leftValue = compiledExpr.evaluate(scope);

  const result = (rightValue + leftValue) / 2;

  steps.push({
    title: "Evaluación por límites laterales",
    content: `Límite por la derecha (${variable} → ${numPoint}+): ${rightValue.toFixed(6)}\nLímite por la izquierda (${variable} → ${numPoint}-): ${leftValue.toFixed(6)}`,
  });

  steps.push({
    title: "Promedio de límites laterales",
    content: `Resultado: ${result.toFixed(6)}`,
  });

  return { steps, result: parseFloat(result.toFixed(4)) };
}

/**
 * Simplifica una expresión
 */
function simplifyExpression(expression, variable, point) {
  const steps = [];

  try {
    const simplified = math.simplify(expression);
    steps.push({
      title: "Simplificación",
      content: `Expresión simplificada: ${simplified.toString()}`,
    });

    const scope = {};
    scope[variable] = parseFloat(point);
    const result = simplified.evaluate(scope);

    return { steps, result };
  } catch (e) {
    return { steps: [], result: null };
  }
}

/**
 * Evalúa límites al infinito
 */
function evaluateInfinityLimit(expression, variable, point) {
  const steps = [];
  const compiledExpr = math.compile(expression);

  const isPositiveInf = point === "infinity" || point === Infinity;
  const testValue = isPositiveInf ? 1000000 : -1000000;

  const scope = {};
  scope[variable] = testValue;

  try {
    const result = compiledExpr.evaluate(scope);

    steps.push({
      title: "Evaluación en valor grande",
      content: `Evaluando en ${variable} = ${testValue}: ${result}`,
    });

    if (Math.abs(result) > 100000) {
      steps.push({
        title: "Comportamiento asintótico",
        content: `La función tiende a ${result > 0 ? "∞" : "-∞"}`,
      });
      return { steps, result: result > 0 ? Infinity : -Infinity };
    }

    return { steps, result };
  } catch (e) {
    return { steps, result: null };
  }
}

/**
 * Evalúa una expresión en infinito
 */
function evaluateAtInfinity(compiledExpr, variable, positive = true) {
  const scope = {};
  scope[variable] = positive ? 1e6 : -1e6;
  const val = compiledExpr.evaluate(scope);

  // Redondear valores que son muy cercanos a un entero
  if (Math.abs(val - Math.round(val)) < 1e-6) {
    return Math.round(val);
  }
  return val;
}

/**
 * Genera ejercicios aleatorios de límites
 */
export function generateRandomLimit() {
  const types = [
    "polynomial",
    "rational_0_0",
    "rational_inf_inf",
    "radical",
    "trigonometric",
  ];

  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case "polynomial":
      return generatePolynomialLimit();
    case "rational_0_0":
      return generateRational00Limit();
    case "rational_inf_inf":
      return generateRationalInfInfLimit();
    case "radical":
      return generateRadicalLimit();
    case "trigonometric":
      return generateTrigonometricLimit();
    default:
      return generatePolynomialLimit();
  }
}

function generatePolynomialLimit() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const point = Math.floor(Math.random() * 5);

  return {
    expression: `${a}*x^2 + ${b}*x + ${Math.floor(Math.random() * 10)}`,
    variable: "x",
    point: point,
    description: "Límite de función polinomial",
  };
}

function generateRational00Limit() {
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `(x^2 - ${a * a}) / (x - ${a})`,
    variable: "x",
    point: a,
    description: "Límite con indeterminación 0/0 (diferencia de cuadrados)",
  };
}

function generateRationalInfInfLimit() {
  const a = Math.floor(Math.random() * 5) + 1;
  const b = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `(${a}*x^2 + ${b}) / (x^2 + 1)`,
    variable: "x",
    point: "infinity",
    description: "Límite al infinito con indeterminación ∞/∞",
  };
}

function generateRadicalLimit() {
  const a = Math.floor(Math.random() * 5) + 1;

  return {
    expression: `(sqrt(x + ${a}) - sqrt(${a})) / x`,
    variable: "x",
    point: 0,
    description: "Límite con radicales",
  };
}

function generateTrigonometricLimit() {
  return {
    expression: "sin(x) / x",
    variable: "x",
    point: 0,
    description: "Límite trigonométrico clásico",
  };
}

/**
 * Maneja indeterminaciones 0/0 con radicales del tipo (sqrt(x + a) - sqrt(a)) / x
 */
function tryRationalizeRadicals(numerator, denominator, variable, point) {
  const steps = [];
  try {
    // Paso 1: Simplificar numerador y denominador
    const numSimplified = math.simplify(numerator).toString();
    const denSimplified = math.simplify(denominator).toString();

    steps.push({
      title: "Simplificación inicial",
      content: `Numerador simplificado: ${formatExpression(numSimplified, { pretty: false })}\nDenominador simplificado: ${formatExpression(denSimplified, { pretty: false })}`,
    });
    // Paso 2: Detectar patrón sqrt(x + a) - sqrt(a)
    const radicalPattern = /^sqrt\(\s*(.+)\s*\)\s*-\s*sqrt\(\s*(.+)\s*\)$/;
    const match = numSimplified.match(radicalPattern);

    if (!match) return null;

    const inside1 = match[1].trim(); // x + a
    const inside2 = match[2].trim(); // a

    // Paso 3: Racionalizar multiplicando conjugado
    const conjugate = `sqrt(${inside1}) + sqrt(${inside2})`;
    const factoredExpr = `(${numSimplified}) * (${conjugate}) / (${denSimplified} * ${conjugate})`;
    const simplified = math.simplify(factoredExpr);

    steps.push({
      title: "Racionalización del radical",
      content: `Multiplicamos numerador y denominador por el conjugado (${conjugate}) para eliminar la raíz: ${simplified.toString()}`,
    });

    // Paso 4: Evaluar en el punto
    const scope = { [variable]: parseFloat(point) };
    const result = simplified.evaluate(scope);

    steps.push({
      title: "Evaluación en el punto",
      content: `Sustituyendo ${variable} = ${point}, el límite es ${result}`,
    });

    return { steps, result };
  } catch (error) {
    console.error("Error en tryRationalizeRadicals:", error);
    return null;
  }
}
