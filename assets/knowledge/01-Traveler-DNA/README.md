# Traveler DNA Knowledge Base

## Propósito

Esta carpeta documenta el contrato local del MVP de Traveler DNA dentro de Travel OS.

## Superficie pública

- `docs/index.html`: portada del sitio.
- `docs/traveler-dna/index.html`: wizard principal.
- `docs/traveler-dna/style.css`: UI responsive y dark mode automático.
- `docs/traveler-dna/app.js`: lógica del flujo, persistencia, scoring y exportes.
- `docs/traveler-dna/questions.json`: esquema de secciones, preguntas, opciones y pesos.

## Persistencia

- El borrador vive en `localStorage` bajo `travel-os.traveler-dna.draft.v1`.
- El resultado final queda guardado en `travel-os.traveler-dna.final.v1`.
- El usuario puede cerrar el navegador y retomar después.

## Contrato de exportación

El resumen final debe poder materializarse en tres formatos sin tocar la UI:

- `traveler-dna.json`
- `traveler-summary.html`
- `traveler-summary.md`

## Capa de integración futura

La interfaz interna debe permanecer desacoplada de la capa de salida.
El punto de extensión recomendado es un registro de adaptadores con esta forma:

```text
{
  id: "github" | "supabase" | "firebase" | "sheets",
  canHandle(payload) -> boolean,
  send(payload) -> Promise<void>
}
```

El formulario no debe conocer detalles de credenciales, endpoints ni secretos.

## Criterios de UX

- Mobile first.
- Botones grandes.
- Progreso visible.
- Resumen legible.
- Exportación manual y explícita.
