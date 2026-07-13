# ADR-002 - Dominio y entidades del Sistema Operativo Personal para Viajar

Estado: PROPUESTO - pendiente firma de Yued El Jeitani
Fecha: 2026-07-12
Alcance: `docs/traveler-dna/app.js`, `docs/traveler-dna/questions.json`, `assets/knowledge/01-Traveler-DNA/*`
Decisión que reemplaza: modelo implícito de cuestionario aislado sin separación fuerte entre DNA, Mission, Rules, Trip y Trip Log

## Contexto

Travel OS deja de ser solo un generador de perfiles. La unidad de valor del producto es un ciclo:

`Traveler Identity -> Traveler DNA -> Travel Mission -> Planner -> Booking -> Travel Companion -> Trip Log -> Reflection -> Traveler Evolution -> Traveler DNA`

Cada viaje debe mejorar el siguiente perfil. El cuestionario es solo la puerta de entrada.

El dominio necesita separar lo estable de lo circunstancial y lo descriptivo de lo ejecutable.

## Principio rector

Travel OS no vende itinerarios. Construye un modelo vivo del viajero que mejora con cada viaje.

Esa frase cambia el orden de las preguntas de arquitectura:

1. Quien es el viajero.
2. Que prefiere de forma estable.
3. Que quiere hacer esta vez.
4. Como se valida y ejecuta el plan.
5. Que se aprendio realmente del viaje.

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
- La implementación es híbrida: catálogo base + reglas personalizadas del viajero.
- Ejemplos:
  - `hard`: vigencia de pasaporte, visa, limitaciones médicas, seguridad.
  - `soft`: layover ideal, preferencia de hotel, ritmo de viaje.
  - `optimization`: minimizar fatiga, maximizar valor familiar, balancear costo y confort.
- Estas reglas conviven con el DNA; no lo sustituyen.

## Mapa de capas

### 1. Traveler Identity

La capa más estable del sistema.

Incluye:

- edad o rango de edad
- hijos
- país de residencia
- idiomas
- pasaportes
- visas
- presupuesto habitual
- tarjetas
- programas de lealtad
- necesidades médicas
- movilidad
- restricciones de viaje

Reglas:

- No se exporta por defecto a prompts externos.
- No se mezcla con el DNA.
- No se trata como preferencia.
- Se redacta antes de cualquier integración futura.

### 2. Traveler DNA

Describe afinidades relativamente estables.

Incluye:

- arquetipos
- intereses
- ritmos preferidos
- señales de estilo
- señales abiertas interpretadas como weak signal

El DNA responde a "quien soy como viajero" y no a "que quiero hacer este viaje".

### 3. Travel Mission

Contexto de un viaje concreto.

Incluye:

- destino o destinos
- fechas
- compañía
- presupuesto del viaje
- propósito
- flexibilidad
- necesidades del trayecto

El Mission responde a "que quiero hacer esta vez".

### 4. Planner

No compite con Google Flights, Booking, Expedia ni motores de inventario.

El Planner es una capa de inteligencia:

- propone
- compara
- explica
- valida

La salida del Planner no es una reserva. Es una decisión mejor informada.

### 5. Booking

La capa de reservas y confirmaciones.

- PNRs
- hoteles
- transportes
- actividades
- vouchers

El booking puede vivir fuera del sistema al principio, pero debe poder representarse dentro del ciclo.

### 6. Travel Companion

La experiencia durante el viaje.

- day sheet
- accesos rápidos
- cambios
- recordatorios
- navegación
- soporte offline

### 7. Trip Log

Registro de lo que realmente ocurrió.

Fuentes:

- tiempo de permanencia
- fotos
- revisitas
- comentarios
- notas
- frecuencia de actividad
- señales de salud si existen integraciones explícitas

### Memory Score

Memory Score pertenece al Trip Log.

No pertenece al Planner porque no evalúa intención; evalúa evidencia vivida.

Se alimenta de:

- frecuencia de fotos
- tiempo de permanencia
- comentarios
- HR o fatiga si hubo integración explícita
- revisitas
- calificación posterior

### 8. Reflection

Post-viaje, breve y estructurado.

Preguntas típicas:

- que fue lo mejor
- que no repetirias
- que si repetirias
- que cambio de contexto influyo en la experiencia

### 9. Traveler Evolution

La capa que actualiza el DNA con preferencia revelada.

Es la memoria que vuelve al sistema mejor cada vez.

## Modelo de dominio

| Entidad | Qué es | Vida útil | Fuente de verdad | Uso |
|---|---|---|---|---|
| Identity | Datos permanentes o casi permanentes del viajero | Larga | Perfil del usuario | Personalización, seguridad y redacción |
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

### Ejemplo semántico

- `Yued` -> `prefers` -> `Ryokan`
- `Ryokan` -> `because_of` -> `Onsen privado`
- `Onsen privado` -> `because_of` -> `Relajación`
- `Relajación` -> `related_to` -> `Viajes familiares`

Ese tipo de relación es más valioso que una lista plana de respuestas.

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
- No se compite con motores de inventario.

## Consecuencias

- El dominio queda estable antes de abrir adaptadores a GitHub, Supabase, Firebase o Sheets.
- El payload congelado permite validar cambios de forma automática.
- Las reglas híbridas separan seguridad, preferencias y optimización.
- El grafo queda preparado para aprendizaje incremental sin reescribir el wizard.
- Traveler Identity queda antes que DNA en todas las futuras decisiones de diseño.
- Memory Score vive en Trip Log, no en Planner.
- Health integrations quedan en backlog hasta que Trip Log exista como producto vivo.

## Grupo y optimización

El DNA de grupo no es una simple intersección.

Debe modelarse como un problema de optimización con esta forma:

`Maximizar: suma de felicidad individual - penalizacion por conflictos + valor familiar - fatiga`

Implicaciones:

- El solver es posterior a tener al menos dos o más perfiles reales.
- El V1 debe detectar conflictos por pares y el top compartido.
- La función objetivo es una preferencia explícita, no una verdad universal.

## Health

Las integraciones de salud entran después del Trip Log y solo con caso de uso claro.

Plataformas candidatas:

- Apple Health
- Garmin
- Oura
- WHOOP
- Polar

Usos futuros:

- jet lag
- fatiga
- sueño
- recuperación

## Fase 0 / Architecture Freeze

Durante esta fase se congelan:

- dominio
- entidades
- payloads
- nomenclatura
- ADRs
- estructura del repositorio

Regla de salida:

- Solo después de congelar esta capa se vuelve a escribir código sobre nuevas entidades.
- Los cambios futuros deben referenciar este paquete antes de abrir módulos nuevos.

## Paquete de Fase 0

Este ADR se firma junto con:

- `assets/knowledge/01-Traveler-DNA/traveler-dna.payload.schema.v1.json`
- `assets/knowledge/01-Traveler-DNA/Nomenclatura-y-Estructura-del-repo.md`
- `README.md`

## Firma

- [ ] Aprobado por: Yued El Jeitani
- Fecha de firma: ____________
- Decisión adoptada: Fase 0
- Ajustes a la propuesta: ____________
