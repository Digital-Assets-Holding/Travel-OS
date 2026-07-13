# Nomenclatura y estructura del repo

Estado: propuesta operativa
Fecha: 2026-07-12
Objetivo: un concepto, una casa

## Principios

- `docs/` es la superficie pública y navegable.
- `assets/knowledge/01-Traveler-DNA/` es la fuente de verdad del dominio.
- `app.js` contiene runtime, scoring, persistencia y exportación.
- `questions.json` contiene el catálogo, la taxonomía visible y los pesos.
- `README.md` indexa; no duplica contratos.
- Un cambio de contrato requiere un archivo nuevo, no una reescritura silenciosa.

## Convenciones de nombres

- ADRs: `ADR-###-Slug.md`
- Taxonomías de consolidación: `C#-Slug.md`
- Esquemas de exportación: `*.schema.v1.json`
- Documentos de paquete o referencia: `README.md`
- Identificadores internos: `snake_case`
- Identificadores de secciones: `kebab-case`
- Labels visibles: lenguaje natural, sin lógica incrustada

## Casas del repo

```text
Travel-OS/
  docs/
    index.html
    traveler-dna/
      index.html
      style.css
      app.js
      questions.json
  assets/
    knowledge/
      01-Traveler-DNA/
        README.md
        ADR-002-Dominio-y-Entidades.md
        C2-Archetype-Consolidation.md
        Nomenclatura-y-Estructura-del-repo.md
        traveler-dna.payload.schema.v1.json
```

## Regla de separación

- La UI no decide taxonomía.
- La taxonomía no decide persistencia.
- La persistencia no decide integraciones.
- Los adaptadores futuros leerán el payload congelado, no el DOM.

## Extensión futura

Cuando el backend se abra, las casas nuevas deben seguir la misma lógica:

- `adapters/github`
- `adapters/supabase`
- `adapters/firebase`
- `adapters/sheets`

Cada adaptador recibe el mismo payload v1 y devuelve el mismo contrato de salida.

## Lo que no hacer

- No crear carpetas vacías por intuición.
- No mezclar documentación de dominio con detalles de implementación.
- No guardar decisiones de arquitectura dentro de `questions.json`.
- No romper compatibilidad del payload sin emitir una nueva versión.

