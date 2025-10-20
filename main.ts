import { createApp } from 'vue'
import App from './App.vue'

// Estilos globales
import './main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'

import 'primeicons/primeicons.css'

// Plugins Vue
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import HighchartsVue from 'highcharts-vue'

// Configurar Highcharts en español
import Highcharts from 'highcharts'

Highcharts.setOptions({
    lang: {
        months: [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ],
        weekdays: [
            'Domingo', 'Lunes', 'Martes', 'Miércoles',
            'Jueves', 'Viernes', 'Sábado'
        ],
        shortMonths: [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ],
        decimalPoint: ',',
        thousandsSep: '.',
        loading: 'Cargando...',
        noData: 'No hay datos para mostrar',
        resetZoom: 'Resetear zoom',
        resetZoomTitle: 'Resetear zoom nivel 1:1',
        downloadPNG: 'Descargar imagen PNG',
        downloadJPEG: 'Descargar imagen JPEG',
        downloadPDF: 'Descargar documento PDF',
        downloadSVG: 'Descargar imagen SVG',
        printChart: 'Imprimir gráfico',
        viewFullscreen: 'Ver en pantalla completa',
        exitFullscreen: 'Salir de pantalla completa'
    }
})

const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false,
            cssLayer: false
        }
    }
})

app.use(HighchartsVue)
app.mount('#app')