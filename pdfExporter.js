import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Exporta el contenido de un elemento HTML a PDF
 * @param {HTMLElement} element - Elemento a exportar
 * @param {string} filename - Nombre del archivo PDF
 */
export async function exportToPDF(element, filename = 'ejercicio-calculo.pdf') {
  try {
    // Crear canvas del elemento
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Agregar primera página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Agregar páginas adicionales si es necesario
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Guardar PDF
    pdf.save(filename)
    return true
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    return false
  }
}

/**
 * Genera un PDF con la solución paso a paso
 * @param {Object} result - Resultado del cálculo
 * @param {string} type - Tipo de ejercicio ('limit' o 'derivative')
 */
export async function generateSolutionPDF(result, type = 'limit') {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const margin = 20
  const pageWidth = 210
  const contentWidth = pageWidth - (2 * margin)
  let yPosition = margin

  // Título
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CalcDiff Pro', margin, yPosition)
  yPosition += 8

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Solución Paso a Paso', margin, yPosition)
  yPosition += 15

  // Tipo de ejercicio
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  const title = type === 'limit' ? 'Cálculo de Límite' : 'Cálculo de Derivada'
  pdf.text(title, margin, yPosition)
  yPosition += 10

  // Expresión
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Expresión: ${result.expression}`, margin, yPosition)
  yPosition += 7

  if (type === 'limit') {
    pdf.text(`Punto: ${result.variable} → ${result.point}`, margin, yPosition)
    yPosition += 7
  } else {
    pdf.text(`Variable: ${result.variable}`, margin, yPosition)
    yPosition += 7
    if (result.order > 1) {
      pdf.text(`Orden: ${result.order}`, margin, yPosition)
      yPosition += 7
    }
  }

  yPosition += 5

  // Resultado final
  pdf.setFillColor(220, 252, 231)
  pdf.rect(margin, yPosition, contentWidth, 15, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.text('Resultado:', margin + 5, yPosition + 6)
  pdf.setFont('helvetica', 'normal')
  pdf.text(String(result.result), margin + 5, yPosition + 11)
  yPosition += 20

  // Indeterminación (solo para límites)
  if (type === 'limit' && result.indetermination) {
    pdf.setFillColor(254, 243, 199)
    pdf.rect(margin, yPosition, contentWidth, 12, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Indeterminación:', margin + 5, yPosition + 5)
    pdf.setFont('helvetica', 'normal')
    pdf.text(result.indetermination, margin + 5, yPosition + 9)
    yPosition += 15

    if (result.factorizationMethod) {
      pdf.text(`Método: ${result.factorizationMethod}`, margin + 5, yPosition)
      yPosition += 7
    }
  }

  // Reglas aplicadas (solo para derivadas)
  if (type === 'derivative' && result.rules && result.rules.length > 0) {
    pdf.setFillColor(219, 234, 254)
    const rulesHeight = 8 + (result.rules.length * 5)
    pdf.rect(margin, yPosition, contentWidth, rulesHeight, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Reglas aplicadas:', margin + 5, yPosition + 5)
    yPosition += 8
    pdf.setFont('helvetica', 'normal')
    result.rules.forEach(rule => {
      pdf.text(`• ${rule}`, margin + 10, yPosition)
      yPosition += 5
    })
    yPosition += 5
  }

  yPosition += 5

  // Pasos
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Pasos de la Solución:', margin, yPosition)
  yPosition += 10

  pdf.setFontSize(10)
  result.steps.forEach((step, index) => {
    // Verificar si necesitamos nueva página
    if (yPosition > 270) {
      pdf.addPage()
      yPosition = margin
    }

    // Número del paso
    pdf.setFillColor(102, 126, 234)
    pdf.circle(margin + 4, yPosition - 2, 4, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text(String(index + 1), margin + 2.5, yPosition + 1)
    pdf.setTextColor(0, 0, 0)

    // Título del paso
    pdf.setFont('helvetica', 'bold')
    pdf.text(step.title, margin + 12, yPosition)
    yPosition += 6

    // Contenido del paso
    pdf.setFont('helvetica', 'normal')
    const lines = pdf.splitTextToSize(step.content, contentWidth - 12)
    lines.forEach(line => {
      if (yPosition > 280) {
        pdf.addPage()
        yPosition = margin
      }
      pdf.text(line, margin + 12, yPosition)
      yPosition += 5
    })

    // Resultado del paso
    if (step.result) {
      yPosition += 2
      pdf.setFillColor(249, 250, 251)
      pdf.rect(margin + 12, yPosition - 3, contentWidth - 12, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.text('Resultado: ', margin + 14, yPosition + 2)
      pdf.setFont('helvetica', 'normal')
      pdf.text(String(step.result), margin + 38, yPosition + 2)
      yPosition += 8
    }

    yPosition += 8
  })

  // Footer
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text(
      `Página ${i} de ${pageCount} - Generado por CalcDiff Pro`,
      pageWidth / 2,
      290,
      { align: 'center' }
    )
  }

  // Guardar
  const filename = type === 'limit' 
    ? `limite-${Date.now()}.pdf`
    : `derivada-${Date.now()}.pdf`
  
  pdf.save(filename)
  return true
}

