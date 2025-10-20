<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Highcharts from 'highcharts'
import { create, all } from 'mathjs'

const math = create(all)

const props = defineProps({
  expression: {
    type: String,
    required: true
  },
  variable: {
    type: String,
    default: 'x'
  },
  point: {
    type: [Number, String],
    default: null
  },
  limitValue: {
    type: [Number, String],
    default: null
  },
  showDerivative: {
    type: Boolean,
    default: false
  },
  derivativeExpression: {
    type: String,
    default: null
  }
})

const chartContainer = ref(null)
let chart = null

const generatePoints = (expr, varName, start = -10, end = 10, steps = 200) => {
  const points = []
  const step = (end - start) / steps
  
  try {
    const compiledExpr = math.compile(expr)
    
    for (let i = 0; i <= steps; i++) {
      const x = start + i * step
      const scope = {}
      scope[varName] = x
      
      try {
        const y = compiledExpr.evaluate(scope)
        
        // Filtrar valores infinitos o NaN
        if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1000) {
          points.push([x, y])
        } else {
          // Agregar punto nulo para discontinuidades
          if (points.length > 0) {
            points.push([x, null])
          }
        }
      } catch (e) {
        // Punto indefinido
        if (points.length > 0) {
          points.push([x, null])
        }
      }
    }
  } catch (error) {
    console.error('Error generando puntos:', error)
  }
  
  return points
}

const createChart = () => {
  if (!chartContainer.value) return
  
  const series = []
  
  // Serie principal: función original
  const mainPoints = generatePoints(props.expression, props.variable)
  
  series.push({
    name: `f(${props.variable})`,
    data: mainPoints,
    color: '#4F46E5',
    lineWidth: 3,
    marker: {
      enabled: false
    }
  })
  
  // Si hay un punto límite, marcarlo
  if (props.point !== null && props.limitValue !== null && isFinite(props.limitValue)) {
    const pointNum = parseFloat(props.point)
    
    if (isFinite(pointNum)) {
      // Punto en el límite
      series.push({
        name: 'Punto límite',
        data: [[pointNum, props.limitValue]],
        type: 'scatter',
        color: '#EF4444',
        marker: {
          enabled: true,
          radius: 8,
          symbol: 'circle'
        },
        tooltip: {
          pointFormat: `<b>Límite en x = ${pointNum}</b><br/>y = {point.y:.4f}`
        }
      })
      
      // Línea vertical en el punto
      series.push({
        name: 'Línea vertical',
        data: [[pointNum, -1000], [pointNum, 1000]],
        color: '#EF4444',
        lineWidth: 1,
        dashStyle: 'Dash',
        marker: {
          enabled: false
        },
        enableMouseTracking: false,
        showInLegend: false
      })
    }
  }
  
  // Si se debe mostrar la derivada
  if (props.showDerivative && props.derivativeExpression) {
    try {
      const derivPoints = generatePoints(props.derivativeExpression, props.variable)
      
      series.push({
        name: `f'(${props.variable})`,
        data: derivPoints,
        color: '#10B981',
        lineWidth: 2,
        dashStyle: 'ShortDash',
        marker: {
          enabled: false
        }
      })
    } catch (e) {
      console.error('Error graficando derivada:', e)
    }
  }
  
  // Configuración del gráfico
  const options = {
    chart: {
      type: 'line',
      height: 400,
      backgroundColor: '#F9FAFB',
      borderRadius: 8
    },
    title: {
      text: null
    },
    xAxis: {
      title: {
        text: props.variable,
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      gridLineWidth: 1,
      gridLineColor: '#E5E7EB',
      crosshair: true
    },
    yAxis: {
      title: {
        text: `f(${props.variable})`,
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        }
      },
      gridLineColor: '#E5E7EB',
      crosshair: true
    },
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '12px',
        fontWeight: 'normal'
      }
    },
    tooltip: {
      shared: true,
      crosshairs: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#D1D5DB',
      borderRadius: 8,
      shadow: true,
      useHTML: true,
      headerFormat: '<b>{point.key:.4f}</b><br/>',
      pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:.4f}</b><br/>'
    },
    plotOptions: {
      line: {
        connectNulls: false,
        animation: {
          duration: 1000
        }
      },
      series: {
        states: {
          hover: {
            lineWidthPlus: 1
          }
        }
      }
    },
    series: series,
    credits: {
      enabled: false
    }
  }
  
  // Crear o actualizar el gráfico
  if (chart) {
    chart.destroy()
  }
  
  chart = Highcharts.chart(chartContainer.value, options)
}

// Observar cambios en las props
watch(
  () => [props.expression, props.variable, props.point, props.limitValue, props.showDerivative, props.derivativeExpression],
  () => {
    createChart()
  },
  { deep: true }
)

onMounted(() => {
  createChart()
})
</script>

<template>
  <div class="function-graph">
    <div ref="chartContainer" class="chart-container"></div>
    <div class="mt-3 text-center text-sm text-gray-600">
      <p>
        <i class="pi pi-info-circle"></i>
        Pasa el cursor sobre la gráfica para ver los valores exactos
      </p>
    </div>
  </div>
</template>

<style scoped>
.function-graph {
  width: 100%;
}

.chart-container {
  width: 100%;
  min-height: 400px;
}
</style>

