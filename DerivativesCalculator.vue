<script setup>
import { ref, computed } from "vue";
import {
  calculateDerivative,
  generateRandomDerivative,
} from "./derivativesCalculator";
import { generateSolutionPDF } from "./pdfExporter";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Card from "primevue/card";
import Dropdown from "primevue/dropdown";
import Checkbox from "primevue/checkbox";
import InputNumber from "primevue/inputnumber";
import FunctionGraph from "./FunctionGraph.vue";

const props = defineProps({
  subsection: {
    type: String,
    default: "basic",
  },
});

const expression = ref("x^3 + 2*x^2 + x");
const variable = ref("x");
const order = ref(1);
const implicit = ref(false);
const difficulty = ref("Básica");
const result = ref(null);
const calculating = ref(false);
// Estado para el ejercicio personalizado
const customExpression = ref("");
const customType = ref(null);
const showSteps = ref(true);
const showExplanations = ref(true);
const showGraph = ref(false);

const difficulties = ref(["Básica", "Intermedia", "Avanzada"]);

const calculate = () => {
  calculating.value = true;

  setTimeout(() => {
    result.value = calculateDerivative(
      expression.value,
      variable.value,
      order.value,
      implicit.value
    );
    calculating.value = false;
  }, 100);
};

const generateRandom = () => {
  const randomDerivative = generateRandomDerivative();
  expression.value = randomDerivative.expression;
  variable.value = randomDerivative.variable;
  order.value = randomDerivative.order;
  implicit.value = randomDerivative.implicit;
  result.value = null;
};

const createCustomExercise = () => {
  if (!customExpression.value) {
    alert("Por favor, ingresa una función antes de generar el ejercicio.");
    return;
  }

  // Si es derivada implícita, marcamos el flag
  implicit.value = customType.value === "Derivada implícita";

  // Actualizar los campos base
  expression.value = customExpression.value;
  order.value = customType.value === "Orden superior" ? 2 : 1;

  // Calcular directamente
  calculate();
};

const clear = () => {
  expression.value = "";
  variable.value = "x";
  order.value = 1;
  implicit.value = false;
  result.value = null;
};

const hasResult = computed(() => result.value !== null);

const exportPDF = async () => {
  if (!result.value) return;
  await generateSolutionPDF(result.value, "derivative");
};
</script>

<template>
  <div class="derivatives-calculator">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Generador de Ejercicios - Derivadas</h2>
        <p class="page-subtitle">
          Selecciona el tipo de derivada y genera ejercicios personalizados
        </p>
      </div>
      <div class="header-actions">
        <Dropdown
          v-model="difficulty"
          :options="difficulties"
          placeholder="Dificultad: Básica"
          class="difficulty-dropdown"
        />
        <Button
          label="Generar"
          icon="pi pi-refresh"
          @click="generateRandom"
          class="generate-btn"
        />
      </div>
    </div>

    <div class="content-grid">
      <!-- Left Column -->
      <div class="left-column">
        <Card class="exercise-card">
          <template #header>
            <div class="card-header">
              <h3>Ejercicio Actual</h3>
              <span class="exercise-type-badge">{{
                subsection === "implicit"
                  ? "Derivada implícita"
                  : "Derivada explícita"
              }}</span>
            </div>
          </template>

          <template #content>
            <div class="exercise-form">
              <div class="form-group">
                <label>Encuentra la derivada de:</label>
                <InputText
                  v-model="expression"
                  :placeholder="
                    implicit ? 'Ej: x^2 + y^2 = 25' : 'Ej: x^3 + 2*x^2 + x'
                  "
                  class="w-full expression-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Variable</label>
                  <InputText
                    v-model="variable"
                    placeholder="x"
                    class="w-full"
                  />
                </div>
                <div class="form-group">
                  <label>Orden de derivada</label>
                  <InputNumber
                    v-model="order"
                    :min="1"
                    :max="5"
                    showButtons
                    buttonLayout="horizontal"
                    class="w-full"
                    :disabled="implicit"
                  />
                </div>
              </div>

              <div class="checkbox-option">
                <Checkbox
                  v-model="implicit"
                  inputId="implicit"
                  :binary="true"
                />
                <label for="implicit">Derivación implícita</label>
              </div>

              <div class="time-estimate">
                <i class="pi pi-clock"></i>
                Tiempo estimado: 5 min
              </div>

              <Button
                label="Resolver"
                icon="pi pi-play"
                @click="calculate"
                :loading="calculating"
                class="w-full solve-btn"
              />
            </div>
          </template>
        </Card>

        <!-- Exercise Type Cards -->
        <div class="exercise-types">
          <div class="type-card">
            <i class="pi pi-chart-bar type-icon"></i>
            <h4>Derivadas Básicas</h4>
            <p>Funciones polinómicas, racionales y básicas</p>
            <span class="exercise-count">23 ejercicios disponibles</span>
          </div>

          <div class="type-card">
            <i class="pi pi-link type-icon"></i>
            <div>
              <h4>Regla de la Cadena</h4>
              <p>Composición de funciones y derivadas</p>
              <span class="exercise-count">48 ejercicios disponibles</span>
            </div>
          </div>

          <div class="type-card">
            <i class="pi pi-sitemap type-icon"></i>
            <div>
              <h4>Derivadas Implícitas</h4>
              <p>Funciones definidas implícitamente</p>
              <span class="exercise-count">15 ejercicios disponibles</span>
            </div>
          </div>
        </div>

        <!-- Custom Exercise Creator -->
        <!-- <Card class="custom-exercise-card">
          <template #header>
            <h3 class="card-title">Crear Ejercicio Personalizado</h3>
          </template>

          <template #content>
            <div class="custom-form">
              <div class="form-group">
                <label>Función a derivar</label>
                <InputText
                  v-model="customExpression"
                  placeholder="x^3 + 2xy + y^2 = 5"
                  class="w-full"
                />
              </div>

              <div class="form-group">
                <label>Tipo de derivada</label>
                <Dropdown
                  v-model="customType"
                  :options="[
                    'Derivada implícita',
                    'Derivada explícita',
                    'Orden superior',
                  ]"
                  placeholder="Derivada implícita"
                  class="w-full"
                />
              </div>

              <Button
                label="Generar Ejercicio"
                icon="pi pi-plus"
                class="w-full generate-exercise-btn"
                @click="createCustomExercise"
              />
            </div>
          </template>
        </Card> -->
      </div>

      <!-- Right Column: Solution -->
      <div class="right-column">
        <Card v-if="hasResult" class="solution-card">
          <template #header>
            <div class="solution-header">
              <h3>Solución Paso a Paso</h3>
              <Button
                icon="pi pi-file-pdf"
                text
                rounded
                @click="exportPDF"
                title="Exportar a PDF"
              />
            </div>
          </template>

          <template #content>
            <!-- Result Display -->
            <div class="result-display">
              <div class="step-badge">Resultado final</div>
              <div class="result-formula">
                <span v-if="result.implicit">
                  dy/d{{ result.variable }} = {{ result.result }}
                </span>
                <span v-else-if="result.order === 1">
                  f'({{ result.variable }}) = {{ result.result }}
                </span>
                <span v-else>
                  f<sup>({{ result.order }})</sup>({{ result.variable }}) =
                  {{ result.result }}
                </span>
              </div>
            </div>

            <!-- Rules Applied -->
            <div
              v-if="result.rules && result.rules.length > 0"
              class="rules-box"
            >
              <i class="pi pi-book"></i>
              <div>
                <strong>Reglas aplicadas:</strong>
                <div class="rules-list">
                  <span
                    v-for="(rule, index) in result.rules"
                    :key="index"
                    class="rule-tag"
                  >
                    {{ rule }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Steps -->
            <div class="steps-container">
              <div
                v-for="(step, index) in result.steps"
                :key="index"
                class="step-item"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <h4 class="step-title">{{ step.title }}</h4>
                  <div class="step-description">
                    {{ step.content }}
                  </div>
                  <div v-if="step.result" class="step-result">
                    <strong>Resultado:</strong> {{ step.result }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Graph -->
            <div v-if="!result.implicit" class="graph-container">
              <h4 class="graph-title">Gráfica de la Función Original</h4>
              <FunctionGraph
                :expression="result.expression"
                :variable="result.variable"
                :showDerivative="true"
                :derivativeExpression="result.result"
              />
            </div>
          </template>
        </Card>

        <div v-else class="empty-state">
          <i class="pi pi-calculator empty-icon"></i>
          <h3>Sin solución aún</h3>
          <p>
            Ingresa una expresión y haz clic en "Resolver" para ver el paso a
            paso
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reuse same styles as LimitsCalculator */
.derivatives-calculator {
  animation: fadeIn 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.difficulty-dropdown {
  min-width: 180px;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exercise-card,
.solution-card,
.custom-exercise-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.exercise-type-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.exercise-form {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.expression-input {
  font-family: "Courier New", monospace;
  font-size: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.checkbox-option label {
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.time-estimate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.solve-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  font-weight: 600;
  padding: 0.75rem;
}

.exercise-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.type-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.type-icon {
  font-size: 1.5rem;
  color: #667eea;
  margin-bottom: 0.75rem;
}

.type-card h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.type-card p {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.exercise-count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.custom-form {
  padding: 1.25rem;
}

.solution-options {
  margin: 1.5rem 0;
}

.solution-options h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-item label {
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.generate-exercise-btn {
  background: #f59e0b;
  border: none;
  font-weight: 600;
  padding: 0.75rem;
}

.solution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.solution-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.result-display {
  padding: 1.25rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 8px;
  margin: 1.25rem;
}

.step-badge {
  display: inline-block;
  background: #10b981;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.result-formula {
  font-size: 1.125rem;
  color: #065f46;
  font-weight: 500;
}

.rules-box {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  margin: 1.25rem;
  font-size: 0.875rem;
}

.rules-box i {
  color: #3b82f6;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.rules-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.rule-tag {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.steps-container {
  padding: 1.25rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.step-description {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-line;
}

.step-result {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.graph-container {
  padding: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.graph-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .exercise-types {
    grid-template-columns: 1fr;
  }
}
</style>
