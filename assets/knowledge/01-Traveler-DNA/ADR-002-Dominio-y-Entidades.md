# ADR-002 - Dominio y entidades del Sistema Operativo Personal para Viajar

Estado: PROPUESTO - pendiente firma de Yued El Jeitani
Fecha: 2026-07-12
Alcance: `docs/traveler-dna/app.js`, `docs/traveler-dna/questions.json`, `assets/knowledge/01-Traveler-DNA/*`
Decisión que reemplaza: modelo implícito de cuestionario aislado sin separación fuerte entre DNA, Mission, Rules, Trip y Trip Log

## Contexto

Travel OS deja de ser solo un generador de perfiles. La unidad de valor del producto es un ciclo:

`DNA -> Mission -> Plan -> Dia a dia -> Trip Log -> DNA`

Cada viaje debe mejorar el siguiente perfil. El cuestionario es solo la puerta de entrada.

El dominio necesita separar lo estable de lo circunstancial y lo descriptivo de lo ejecutable.

## Decisiones confirmadas

### D1 - Tradeoffs de 100 puntos

- Cuando una pregunta requiera contraste real entre opciones, el usuario distribuirá 100 puntos.
- La interacción debe ser mobile-first: control táctil, auto-normalizado y sin campos numéricos frágiles.
- La granularidad matemática puede ser gruesa; el objetivo es forzar concesiones, no precisión falsa.
- Esta mecánica aplica a DNA y preferencias estructuradas donde el usuario debe revelar prioridad relativa.

### D2 - Payload congelado v1

- El export de Traveler DNA es un contrato versionado, no solo una descarga.
- El payload público conserva esta superficie:
  - `app`
  - `module`
  - `version`
  - `generatedAt`
  - `profile`
  - `summary`
- `version` debe tratarse como semver del contrato de exportación.
- `affinityPercent` y `confidencePercent` son campos canónicos.
- `scorePercent` se conserva como alias de compatibilidad hacia atrás mientras exista v1.
- `profile.answers`, `profile.scores` y `questionVersion` forman parte del contrato y no deben moverse de lugar sin nueva versión.
- Cualquier cambio incompatible crea `v2`; no se edita `v1` in place.

### D3 - Rules híbridas

- Las Travel Rules se modelan en tres clases:
  - `hard`: no negociables, bloquean o invalidan el plan.
  - `soft`: preferencias que pueden relajarse con explicación.
  - `optimization`: objetivos que ayudan a rankear alternativas.
- Ejemplos:
  - `hard`: vigencia de pasaporte, visa, limitaciones médicas, seguridad.
  - `soft`: layover ideal, preferencia de hotel, ritmo de viaje.
  - `optimization`: minimizar fatiga, maximizar valor familiar, balancear costo y confort.
- Estas reglas conviven con el DNA; no lo sustituyen.

## Modelo de dominio

| Entidad | Qué es | Vida útil | Fuente de verdad | Uso |
|---|---|---|---|---|
| Identity | Datos del viajero y su capa sensible | Larga | Perfil del usuario | Personalización, seguridad y redacción |
| DNA | Afinidades estables y arquetipos | Larga | Traveler DNA | Recomendación y tono del sistema |
| Mission | Contexto de un viaje concreto | Corta | Travel Mission | Planeación de un viaje específico |
| Rules | Restricciones y preferencias operativas | Mixta | Declaradas + reveladas | Validación de planes |
| Trip | Viaje planificado o en curso | Corta | Itinerario y reservas | Ejecución |
| Trip Log | Lo que realmente ocurrió | Histórica | Captura durante y después del viaje | Aprendizaje del sistema |
| Knowledge Graph | Red de entidades, claims y relaciones | Larga | Trace + Trip Log | Explicabilidad y memoria |

## Knowledge Graph

El grafo no se abre en blanco. Primero se diseña el esquema; después se puebla.

### Nodos mínimos

- Identity
- DNA
- Mission
- Rule
- Trip
- Trip Log
- Place
- Preference
- Evidence
- Claim

### Relaciones mínimas

- `prefers`
- `avoids`
- `because_of`
- `satisfies`
- `violates`
- `revisits`
- `anchors`

### Regla de captura

- Fase 0: definir tipos de nodo, tipos de relación y campos obligatorios.
- Fase 1: poblar desde el `trace` actual del wizard.
- Fase 2: enriquecer con Trip Log, fotos, revisitas y señales de memoria.

## Seguridad de Identity

- La capa de identidad es la más sensible del sistema.
- Pasaporte, visas, datos médicos y tarjetas no deben salir por defecto en exports prompt-ready.
- Un export hacia LLM externos debe ser una proyección sanitizada, no el objeto crudo.
- Cuando llegue Supabase, el diseño debe incluir cifrado y RLS desde el día uno.
- Ningún adapter futuro debe asumir acceso a secretos ni a PII sensible sin una capa explícita de redacción.

## No objetivos de esta fase

- No se construye el solver de grupo.
- No se integran wearables.
- No se construye backend.
- No se modifica la UI para soportar esta arquitectura.
- No se expone data sensible en prompt-ready por defecto.

## Consecuencias

- El dominio queda estable antes de abrir adaptadores a GitHub, Supabase, Firebase o Sheets.
- El payload congelado permite validar cambios de forma automática.
- Las reglas híbridas separan seguridad, preferencias y optimización.
- El grafo queda preparado para aprendizaje incremental sin reescribir el wizard.

## Paquete de Fase 0

Este ADR se firma junto con:

- `assets/knowledge/01-Traveler-DNA/traveler-dna.payload.schema.v1.json`
- `assets/knowledge/01-Traveler-DNA/Nomenclatura-y-Estructura-del-repo.md`

## Firma

- [ ] Aprobado por: Yued El Jeitani
- Fecha de firma: ____________
- Decisión adoptada: Fase 0
- Ajustes a la propuesta: ____________

