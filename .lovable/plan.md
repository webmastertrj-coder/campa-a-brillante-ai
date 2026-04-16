
## Plan: Exportación a PDF del contenido generado

### Objetivo
Permitir al usuario descargar el contenido generado por la IA en formato PDF, con texto seleccionable y copiable (no imagen), organizado por producto y canal.

### Enfoque técnico

Usaré **jsPDF** + **html2canvas** NO — eso genera imágenes. En su lugar:

**Opción elegida: `jsPDF` con texto nativo** + soporte de markdown convertido a texto plano formateado. Esto garantiza texto seleccionable/copiable.

Librería: `jspdf` (sin html2canvas). Para el formato:
- Renderizo el contenido manualmente: títulos en negrita, párrafos, listas
- Convierto el markdown a texto estructurado usando una librería ligera (`marked` ya está disponible vía react-markdown, o parseo simple)
- Uso `doc.text()` que produce texto vectorial seleccionable

### Cambios

**1. Nueva utilidad `src/lib/pdf-exporter.ts`**
- Función `exportToPDF(results: ProductResults[], pillar: string)` 
- Por cada producto: encabezado con título + precio + referencia (SKU/handle)
- Por cada canal: subtítulo del canal + contenido formateado
- Conversión simple de markdown (negritas `**`, listas `-`, encabezados `#`) a texto formateado en jsPDF
- Salto de página automático entre productos
- Pie de página con marca AdsGenius AI y fecha

**2. Botones de exportación en `ResultsTabs.tsx`**
- **Botón principal "Descargar PDF completo"** arriba de los resultados (cuando hay 1+ productos): exporta todo
- **Botón pequeño "PDF" por canal individual**: junto al botón "Copiar" actual, exporta solo ese canal de ese producto

**3. Mejora UX**
- Toast de confirmación al descargar
- Ícono `FileDown` de lucide-react
- Estilo coherente con `variant="electric"` para el principal y `outline` para los individuales

### Estructura del PDF generado

```text
┌─────────────────────────────────────┐
│ AdsGenius AI — Campaña [Pilar]      │
│ Fecha: 16 Abr 2026                  │
├─────────────────────────────────────┤
│ ▶ PRODUCTO: Camisa Lino Blanca      │
│   Precio: $120.000  Ref: camisa-01  │
│                                     │
│ ── Instagram ──                     │
│ [contenido con negritas, listas]    │
│                                     │
│ ── TikTok ──                        │
│ [contenido]                         │
│                                     │
│ ▶ PRODUCTO: Pantalón Beige          │
│ ...                                 │
└─────────────────────────────────────┘
```

### Dependencias a añadir
- `jspdf` (única dependencia nueva, ~150KB, sin html2canvas)

### Detalles técnicos del parser markdown → PDF
- Línea por línea: detectar `**texto**` → `setFont('bold')` para ese segmento
- Líneas que empiezan con `- ` o `* ` → bullet con indentación
- Líneas con `#` → tamaño mayor + bold
- Manejo de saltos de línea automáticos con `splitTextToSize()` de jsPDF
- Control manual de posición Y con salto de página al pasar el margen inferior

### Archivos modificados
- ✏️ `src/components/ResultsTabs.tsx` — añadir botones de exportación
- 🆕 `src/lib/pdf-exporter.ts` — lógica de generación
- ✏️ `package.json` — añadir `jspdf`
