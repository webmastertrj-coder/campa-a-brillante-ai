

# Diagnóstico y Plan: Reemplazar generación mock con IA real

## El Problema

El contenido actual es **100% plantillas estáticas** (función `mockGenerate` en `Index.tsx`). Son textos hardcodeados que solo insertan el nombre y precio del producto. No hay inteligencia artificial involucrada — por eso el resultado es genérico, repetitivo y no refleja expertise de un Director Creativo real.

Los prompts expertos ya están configurados en `content-generator.ts` (función `buildPrompt`), pero **nunca se usan**. La función `mockGenerate` los ignora completamente.

## Solución

Conectar la generación a **Lovable AI** (IA real) mediante una edge function que use los system prompts ya definidos. El contenido será único, contextual y de calidad profesional para cada producto y canal.

## Plan de implementación

### 1. Activar Lovable Cloud y crear edge function `generate-content`

- Edge function en `supabase/functions/generate-content/index.ts`
- Recibe: `product` (título, descripción, precio), `pillar`, `channel`
- Usa `buildPrompt()` del lado servidor para construir el prompt completo
- Llama a Lovable AI Gateway con el modelo `google/gemini-3-flash-preview`
- Devuelve el contenido generado como texto
- Maneja errores 429 (rate limit) y 402 (sin créditos)

### 2. Crear cliente en el frontend

- Nuevo archivo `src/lib/ai-client.ts` con función `generateContent(product, pillar, channel)`
- Llama a la edge function vía `supabase.functions.invoke()`
- Genera contenido para los 5 canales en paralelo

### 3. Reemplazar `mockGenerate` en Index.tsx

- Eliminar la función `mockGenerate` completa
- En `handleGenerate`, llamar a la edge function para cada canal
- Mostrar loading real mientras se genera
- Mostrar errores con toast si falla

### 4. Mover prompts al backend

- Duplicar la lógica de `buildPrompt`, `SYSTEM_MASTER`, `PILLAR_PROMPTS` y `CHANNEL_INSTRUCTIONS` dentro de la edge function para que los prompts no sean visibles en el cliente

## Detalles técnicos

- **Modelo**: `google/gemini-3-flash-preview` (rápido, buena calidad)
- **5 llamadas paralelas** por generación (una por canal)
- **Sin streaming** — se muestra el resultado completo cuando termina
- Los prompts quedan protegidos en el backend

