<script setup>
import { ref } from "vue";
import LimitsCalculator from "./LimitsCalculator.vue";
import DerivativesCalculator from "./DerivativesCalculator.vue";
import calculadora from "./icons/icons8-calculadora.gif"

const activeSection = ref("limits");
const activeSubsection = ref("basic");
</script>

<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <img :src="calculadora" alt="calculadora">
          <div class="logo-text">
            <h1>CalcDiff Pro</h1>
            <p>Generador de Ejercicios de Cálculo Diferencial</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h3 class="nav-title">Temas de Derivadas</h3>
          <ul class="nav-list">
            <li
              :class="{
                active:
                  activeSection === 'derivatives' &&
                  activeSubsection === 'basic',
              }"
              @click="
                activeSection = 'derivatives';
                activeSubsection = 'basic';
              "
            >
              <i class="pi pi-angle-right"></i>
              Derivadas Básicas
            </li>
            <li
              :class="{
                active:
                  activeSection === 'derivatives' &&
                  activeSubsection === 'chain',
              }"
              @click="
                activeSection = 'derivatives';
                activeSubsection = 'chain';
              "
            >
              <i class="pi pi-link"></i>
              Regla de la Cadena
            </li>
            <li
              :class="{
                active:
                  activeSection === 'derivatives' &&
                  activeSubsection === 'implicit',
              }"
              @click="
                activeSection = 'derivatives';
                activeSubsection = 'implicit';
              "
            >
              <i class="pi pi-sitemap"></i>
              Derivadas Implícitas
            </li>
            <li
              :class="{
                active:
                  activeSection === 'derivatives' &&
                  activeSubsection === 'higher',
              }"
              @click="
                activeSection = 'derivatives';
                activeSubsection = 'higher';
              "
            >
              <i class="pi pi-sort-amount-up"></i>
              Derivadas de Orden Superior
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <h3 class="nav-title">Límites</h3>
          <ul class="nav-list">
            <li
              :class="{ active: activeSection === 'limits' }"
              @click="activeSection = 'limits'"
            >
              <i class="pi pi-chart-line"></i>
              Límites y Continuidad
            </li>
          </ul>
        </div>

        <div class="nav-section mt-4">
          <h3 class="nav-title">Herramientas</h3>
          <ul class="nav-list">
            <li>
              <i class="pi pi-file-pdf"></i>
              Crear Ejercicio
            </li>
            <li>
              <i class="pi pi-download"></i>
              Exportar PDF
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        <transition name="fade" mode="out-in">
          <LimitsCalculator v-if="activeSection === 'limits'" key="limits" />
          <DerivativesCalculator
            v-else
            key="derivatives"
            :subsection="activeSubsection"
          />
        </transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.logo-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.logo-text p {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  line-height: 1.3;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem 0;
  padding: 0 0.75rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-list li {
  padding: 0.625rem 0.75rem;
  margin: 0.125rem 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.nav-list li:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.nav-list li.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
}

.nav-list li i {
  font-size: 0.875rem;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 2rem;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }

  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
}
</style>
