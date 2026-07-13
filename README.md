# Travel OS

Sistema Operativo Personal para Viajar.

Travel OS no vende itinerarios. Construye un modelo vivo del viajero que mejora con cada viaje.

## Ciclo rector

```text
Traveler Identity
        │
Traveler DNA
        │
Travel Mission
        │
Planner
        │
Booking
        │
Travel Companion
        │
Trip Log
        │
Reflection
        │
Traveler Evolution
        │
(actualiza el DNA)
```

## Capas

- `Traveler Identity`: datos permanentes o casi permanentes del viajero.
- `Traveler DNA`: afinidades estables, arquetipos y señales de gusto.
- `Travel Mission`: contexto del viaje actual.
- `Planner`: capa de inteligencia que propone, no compite con buscadores de viaje.
- `Booking`: reservas y confirmaciones.
- `Travel Companion`: acompañamiento durante el viaje.
- `Trip Log`: lo que pasó de verdad.
- `Reflection`: preguntas cortas post-viaje.
- `Traveler Evolution`: aprendizaje que actualiza el DNA.

## Travel Rules

Las reglas del viajero se separan en:

- `Hard Rules`: no negociables.
- `Soft Preferences`: preferencias que se pueden matizar.
- `Optimization Goals`: objetivos para negociar conflictos.
- El sistema combina un catálogo base con reglas personalizadas del viajero.

Ejemplo:

- Hard: un solo PNR, nunca conexión nocturna, máximo dos hoteles por semana.
- Soft: prefiero ryokan, prefiero cafés locales, evitar malls.
- Optimization: minimizar jet lag, maximizar CPMM, minimizar tiempo perdido, optimizar puntos AMEX.

## Arquitectura fundacional

El paquete de fase 0 está congelado aquí:

- [ADR-002 - Dominio y entidades](assets/knowledge/01-Traveler-DNA/ADR-002-Dominio-y-Entidades.md)
- [Schema v1 del payload](assets/knowledge/01-Traveler-DNA/traveler-dna.payload.schema.v1.json)
- [Nomenclatura y estructura del repo](assets/knowledge/01-Traveler-DNA/Nomenclatura-y-Estructura-del-repo.md)
- [Consolidación C2 de arquetipos](assets/knowledge/01-Traveler-DNA/C2-Archetype-Consolidation.md)

## Superficie pública

- Sitio público: `https://digital-assets-holding.github.io/Travel-OS/`
- [Portada del sitio](docs/index.html)
- [Traveler DNA](docs/traveler-dna/index.html)

## Consumo externo

- Este repo es la casa canónica de Traveler DNA.
- El dash debe consumirlo como enlace externo, no alojarlo como módulo compartido.
- Si se embebe desde otro producto, debe ser una decisión explícita y no un acoplamiento implícito.

## Principios

- Identity va antes que DNA.
- El Knowledge Graph guarda relaciones, no solo respuestas.
- Memory Score vive en Trip Log.
- Las integraciones de salud entran después del Trip Log.
- Los exports no deben incluir datos sensibles por defecto.
- El payload se congela con versionado semántico y JSON Schema.
