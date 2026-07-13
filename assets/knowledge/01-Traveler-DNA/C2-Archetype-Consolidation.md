# C2 - Consolidación de arquetipos Traveler DNA

Estado: propuesta operativa.

## Objetivo

Reducir los 44 arquetipos actuales a ~15 cores calibrables, sin tocar la UI ni el flujo del MVP.
El objetivo no es borrar señal, sino concentrarla para que la calibración de pesos sea estable.

## Reglas

- Un arquetipo actual debe mapear a un core principal.
- Los `secondary tags` preservan matices y explicabilidad.
- No hay doble conteo entre cores en la primera versión de calibración.
- El flujo visible sigue igual; el cambio ocurre en la capa de taxonomía y scoring futuro.
- `scorePercent` no se reinterpreta en esta fase.

## Core taxonomy propuesta

### 1. Explorer

- Primary id: `explorer`
- Secondary tags: `urban_exploration`, `hidden_gems`, `local_experiences`, `dark_tourism`
- Uso: curiosidad urbana, descubrimiento, rutas poco obvias, autenticidad.

### 2. Foodie

- Primary id: `foodie`
- Secondary tags: `local_experiences`
- Uso: gastronomía, mercados, restaurantes, experiencias culinarias.

### 3. Shopper

- Primary id: `shopper`
- Secondary tags: `shopping` alias, `luxury_vintage`
- Uso: retail, moda, boutiques, vintage, compras como motivo de viaje.

### 4. Luxury

- Primary id: `luxury`
- Secondary tags: `cruise`
- Uso: confort, premium, servicio, itinerarios suaves.

### 5. Backpacker

- Primary id: `backpacker`
- Secondary tags: `volunteering`
- Uso: presupuesto, inmersión, hostels, viajes largos y flexibles.

### 6. Business

- Primary id: `business`
- Secondary tags: `technology`
- Uso: productividad, reuniones, work travel, eficiencia.

### 7. Culture

- Primary id: `culture`
- Secondary tags: `history`, `art`, `architecture`, `pilgrimage`
- Uso: patrimonio, museos, significado, contexto histórico.

### 8. Adventure

- Primary id: `adventure`
- Secondary tags: `extreme_sports`, `diving`, `ski`, `safari`
- Uso: adrenalina, actividad, retos físicos, naturaleza activa.

### 9. Outdoor

- Primary id: `outdoor`
- Secondary tags: `camping`, `astronomy`
- Uso: aire libre, naturaleza, campamentos, cielo nocturno.

### 10. Road Trip

- Primary id: `road_trip`
- Secondary tags: `rv`
- Uso: movilidad terrestre, conducción, paradas múltiples, libertad logística.

### 11. Photographer

- Primary id: `photographer`
- Secondary tags: none
- Uso: viaje visual, composición, captura de escenas.

### 12. Sports & Motorsports

- Primary id: `sports_fan`
- Secondary tags: `motorsport`
- Uso: estadios, competición, eventos deportivos, adrenalina de pista.

### 13. Music & Nightlife

- Primary id: `music`
- Secondary tags: `concerts`, `nightlife`, `festivals`
- Uso: vida nocturna, conciertos, festivales, energía social.

### 14. Wellness

- Primary id: `wellness`
- Secondary tags: `spa`
- Uso: descanso, recuperación, bienestar, ritmo suave.

### 15. Family & Entertainment

- Primary id: `family`
- Secondary tags: `kids`, `theme_parks`, `gaming`, `anime`
- Uso: viajes compartidos, entretenimiento, niños, experiencias temáticas.

## Cobertura actual

Los 44 arquetipos quedan cubiertos por la tabla anterior sin perder señal:

- Descubrimiento y autenticidad: `explorer`, `urban_exploration`, `hidden_gems`, `local_experiences`, `dark_tourism`
- Gastronomía: `foodie`
- Retail: `shopper`, `luxury_vintage`
- Premium: `luxury`, `cruise`
- Presupuesto y largo recorrido: `backpacker`, `volunteering`
- Trabajo y eficiencia: `business`, `technology`
- Patrimonio y contexto: `culture`, `history`, `art`, `architecture`, `pilgrimage`
- Acción: `adventure`, `extreme_sports`, `diving`, `ski`, `safari`
- Aire libre: `outdoor`, `camping`, `astronomy`
- Carretera: `road_trip`, `rv`
- Imagen: `photographer`
- Deporte: `sports_fan`, `motorsport`
- Vida social: `music`, `concerts`, `nightlife`, `festivals`
- Bienestar: `wellness`, `spa`
- Grupo y entretenimiento: `family`, `kids`, `theme_parks`, `gaming`, `anime`

## Regla de calibración

En la siguiente iteración, el scoring debería leer este mapa como capa intermedia:

1. `currentArchetypeId -> coreArchetypeId`
2. Los `secondary tags` solo enriquecen trazabilidad y explicabilidad.
3. La UI sigue mostrando cores, no los 44 ids.
4. La calibración de pesos se hace sobre cores, no sobre la taxonomía vieja.

## Riesgos a vigilar

- Si se dejan dos cores para el mismo comportamiento, vuelve el sesgo de cobertura.
- Si los `secondary tags` entran en el top, la taxonomía se re-fragmenta.
- Si `technology` se separa demasiado pronto, el bloque `Business` pierde señal útil.
- Si `Family & Entertainment` se separa en exceso, se multiplican micro-perfiles sin valor de producto.

## Próximo paso

Cuando se abra el sprint de calibración, este documento debe convertirse en la fuente de verdad para:

- la tabla de mapeo en `app.js`
- las pruebas de consolidación
- la recalibración de pesos
- la explicación de perfiles en el resumen
