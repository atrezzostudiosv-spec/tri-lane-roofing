# ATREZZO-PROJECT-STATUS.md

> **Registro maestro de continuidad y cierre de fases — TRI-LANE ROOFING**
>
> Actualizado: **2026-10-23** · Responsable del registro: ATREZZO STUDIOS
>
> Repositorio: `atrezzostudiosv-spec/tri-lane-roofing`
>
> Demo comercial: https://atrezzostudiosv-spec.github.io/tri-lane-roofing/
>
> Fuente de información comercial: https://trilaneroofing.com/
>
> **IMPORTANTE:** el sitio es una propuesta de Atrezzo, no la web oficial de Tri-Lane ni un proyecto contratado. La demo mantiene `noindex, follow`.

## Norma vinculante: avance lineal, sin repetir trabajo

**EJECUTAR → VERIFICAR → REGISTRAR → CERRAR → AVANZAR.**

Los estados posibles y únicos de cada fase son: **PENDIENTE · EN PROCESO · EN VALIDACIÓN · CERRADA · BLOQUEADA**.

- Mantener **una única fase principal EN PROCESO**.
- No reabrir fases **CERRADAS** para volver a auditar, rediseñar o experimentar.
- Solo reabrir el componente afectado si: (1) lo solicita expresamente el usuario; (2) se reproduce un fallo nuevo; (3) un cambio posterior provoca una regresión; o (4) hay un requisito nuevo y confirmado. Anotar motivo, alcance, prueba y decisión.
- Una prueba de regresión **no reabre** la fase validada.
- No pedir de nuevo datos o aprobaciones ya disponibles.
- Antes de cada intervención, consultar **este archivo**, sus decisiones y la evidencia enlazada.
- Al concluir comunicar exclusivamente: **TRABAJO REALIZADO / RESULTADO / ESTADO / SIGUIENTE ACCIÓN**.
- **PROHIBIDO** alterar el diseño, las tipografías, los iconos, los colores, el ritmo visual, las composiciones responsive o los efectos ya aprobados. Una mejora técnica debe ser invisible y estar justificada con evidencia.
- No inventar servicios, zonas, cifras, precios, reseñas, garantías, fotos de trabajos, datos de contacto, licencias ni testimonios.

## Estado maestro

| Fase | Estado | Trabajo realizado y criterio de cierre | Evidencia |
|---|---|---|---|
| 01. Análisis de la web de origen y fidelidad comercial | **CERRADA** | Se consultó la web del negocio y se conservaron los servicios, contactos y afirmaciones acreditados. Las imágenes de concepto se identifican como ilustrativas y no como obras ejecutadas. La aprobación comercial final del cliente es **otra fase dependiente**, no motivo de repetir este análisis. | [QA documentada](docs/final-qa-closeout-2026-10-22.md) |
| 02. Estrategia, arquitectura, copy y SEO de demo | **CERRADA** | Cinco páginas: Home, About, Services, Gallery y Contact; navegación, H1 y estructura verificados. `noindex` activo para demo, sin publicar como web oficial. | [Auditoría pública](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39912736869) |
| 03. Diseño UI/UX y responsive | **CERRADA** | Estética y componentes aprobados. Pruebas de 375, 768, 1024 y 1440 px; sin scroll horizontal en los 20 casos auditados. Tipografías, iconos, fotografías, colores, espaciados y animaciones **congelados**. | [20 vistas públicas](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39912736869) |
| 04. Construcción e interacciones | **CERRADA** | Menús, navegación, visor Gallery, botones, wizard y Contact en la demo comprobados. Los envíos de pruebas automatizadas utilizaron respuestas simuladas, sin suplantar entrega real al cliente. | [QA técnica](docs/final-qa-closeout-2026-10-22.md) |
| 05. Optimización de imágenes y recursos | **CERRADA** | Home, Gallery, About y Services: variantes de fotos ya existentes, revisión de calidad, capturas y mediciones móviles. Se descartaron pruebas de recursos que alteraban la imagen o no demostraban ganancia. No seguir experimentando sin fallo nuevo o solicitud expresa. | [PR #15](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/15), [PR #19](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/19), [PR #21](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/21), [PR #22](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/22) |
| 06. Auditoría técnica general de la demo | **CERRADA** | Cinco páginas × cuatro anchos, 20/20 cargas HTTP 200 y sin desbordes ni errores JS; cinco destinos internos y ocho anclas verificados. Los visores cerrados explican los `img` sin `src` detectados; no se declaró erróneamente que fueran imágenes visibles rotas. | [Auditoría](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39913125697) |
| 07. Accesibilidad de teclado: menú e inquiry | **CERRADA** | Se corrigieron foco inicial, recorrido Tab/Shift+Tab, Escape, foco de retorno, bloqueo de elementos de fondo y transición entre pasos; menú móvil y tablet accesible por teclado. **20/20** casos responsive locales, **20/20** casos públicos y **5/5** comprobaciones axe con modal abierto. Sin cambios de fuentes, iconos ni CSS. | [PR #24](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/24), [QA pública](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39918183226), [Pages publicado](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39918506504) |
| 08. Preparación de presentación comercial de la demo | **EN PROCESO** | Próxima actividad única: elaborar una **ficha breve de presentación comercial** de la demo, con enlace, alcance acreditado y aclaración de que es una propuesta no contratada. No rediseñar ni rehacer auditorías. | Este registro |
| 09. Entrega como web oficial tras contratación | **BLOQUEADA** | Solo tras autorización/compra: confirmar correo del cliente y probar entregas reales, privacidad/textos legales e imágenes y su autorización, revisar dominio/hosting, contactos y claims con el cliente, SEO e indexación oficiales, y realizar controles específicos en el entorno final. No solicitarlo todavía. | Requiere decisiones del cliente |

### Resultado conocido de rendimiento (referencia, NO nueva tarea)

Medianas móviles Lighthouse previas: Home **75**, About **72**, Services **75**, Gallery **79**; Contact **87** en una prueba. Los LCP medidos en laboratorio siguen por encima del ideal en varias páginas. Son resultados de laboratorio con variabilidad, **no** una promesa de velocidad ni motivo para reabrir automáticamente la optimización. Ver evidencias y metodología en [informe técnico](docs/final-qa-closeout-2026-10-22.md).

### Límites y pruebas NO comprobadas

- Los análisis automatizados axe no acreditan conformidad integral WCAG 2.2 AA ni sustituyen una revisión manual de lector de pantalla o de dispositivos físicos. Esta revisión se reservará para una necesidad técnica confirmada o la preparación de producción, sin rehacer las fases completas.
- Las simulaciones de FormSubmit no prueban recepción real en la bandeja del cliente. La demo utiliza el **destino provisional de Atrezzo**; no cambiarlo antes de la contratación y autorización.
- La demo no puede presentarse como sitio oficial de Tri-Lane ni indexarse.
- Esta tabla distingue los cierres técnicos acreditados de las autorizaciones comerciales externas; no clasificar una dependencia del cliente como fallo del sitio.

## Decisiones aprobadas e inmutables salvo orden nueva

1. Conservar los cinco documentos HTML y el diseño actual, incluidas tipografías **Barlow Condensed y Manrope**, iconografía Font Awesome existente, paleta y animaciones.
2. Conservar las fotografías actuales con disclosure ilustrativo, sin tratarlas como trabajos de Tri-Lane.
3. Mantener nombres, servicios, contactos, reseñas y textos derivados de la fuente verificada, sin ampliarlos por intuición.
4. Mantener las cinco páginas de la demo bajo `noindex`; los previews archivados bajo `noindex, nofollow`.
5. Mantener el envío provisional y las advertencias de contacto hasta una decisión comercial posterior.
6. Prohibir cambios extensivos o experimentos redundantes una vez obtenida una prueba satisfactoria.
7. El usuario **pospuso explícitamente correo definitivo, privacidad y condiciones de producción hasta después de comprar el sitio**; no incluirlos en la lista operativa actual.

## Registro de reaperturas

| Fecha | Fase | Causa justificada | Alcance limitado | Cierre |
|---|---|---|---|---|
| 2026-10-23 | 07. Teclado | Se detectó un fallo reproducible de foco en el asistente y de Escape en el menú durante la auditoría. | Solo `assets/js/site.js`, sin CSS, HTML ni assets. | **CERRADA**, PR #24 y 20/20 + 5/5 pruebas públicas. |

## ÚNICA siguiente acción autorizada por el estado

**Fase 08 — Preparar una ficha comercial breve de presentación para el prospecto con la URL de la demo y los hechos comprobados, sin anunciar servicios inventados, imágenes de proyectos reales, relaciones contractuales ni publicar el sitio como oficial.**

No volver a analizar las cinco páginas, la galería, los formularios, el teclado, los hero ni el rendimiento salvo causa de reapertura registrada.
