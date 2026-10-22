# Tri-Lane Roofing — Auditoría inicial de optimización

**Fecha:** 2026-10-22  
**Rama:** `optimization-seo-noindex-20261022`  
**Sitio de referencia del negocio:** https://trilaneroofing.com/  
**Demostración (acceso remoto no validado en esta revisión):** https://atrezzostudiosv-spec.github.io/tri-lane-roofing/

## Alcance comprobado

Auditoría estática del código actual de `index.html`, `about.html`, `services.html`, `gallery.html`, `contact.html`, `assets/js/site.js`, `assets/css/custom.css` y recursos enlazados. Revisión documental del sitio original accesible. No se dispuso de pruebas visuales en navegador ni Lighthouse/PageSpeed aplicados a la demo.

## Hallazgos verificados

| Área | Resultado | Prioridad |
|---|---|---|
| SEO on-page | Cada página tiene un `title`, `meta description` y exactamente un `h1`. | Conservar |
| Indexación demo | Ninguna de las cinco páginas en `main` tiene `meta robots noindex`; se ha preparado `noindex, follow` SOLO en esta rama. | **Crítica** |
| Canonical / social | No hay canonical, etiquetas Open Graph ni Twitter Card. No activar canonical del dominio final hasta la publicación aprobada. | Posterior a noindex |
| SEO técnico | No existen `robots.txt` ni `sitemap.xml` en la raíz del repositorio; no implica que una URL esté publicada ni su respuesta HTTP. En GitHub Pages de proyecto, un robots.txt bajo `/tri-lane-roofing/` no sería el robots.txt de la raíz del host. | Producción |
| Estructura | 147 enlaces `href` revisados; los enlaces internos a archivos del proyecto y anchors examinados no mostraron destinos inexistentes en la fuente. No se comprobaron respuestas HTTP. | Conservar / probar |
| Imágenes | 40 elementos `img` en total; 30 no declaran ambos atributos HTML `width` y `height`. No implica CLS medido, requiere comprobación visual. | Alta |
| Tamaño HTML | `services.html` ~576 KB, `gallery.html` ~720 KB; incluyen aproximadamente 529 y 676 KB de imágenes WebP embebidas en Base64 respectivamente. | Alta |
| Estilos | Las cinco páginas cargan Tailwind CDN de desarrollo, CSS fallback y CSS personalizado; revisar consolidación con comparación visual antes de sustituir. | Alta |
| Contacto | La validación `handleContactSubmit()` no realiza una solicitud a servidor, correo ni servicio de recepción; muestra confirmación local. | **Crítica para lanzamiento** |
| Solicitud guiada | `submitWizardInquiry()` valida localmente y muestra un mensaje; no envía información a un destino real. | **Crítica para lanzamiento** |
| Contenido | La cita atribuida a Jessica M. en Home está reescrita respecto al testimonio publicado en la web original; revisar fidelidad antes del lanzamiento. También revisar la cita de Services. | Alta |
| Accesibilidad | Existen reglas `prefers-reduced-motion`, controles de enfoque y alternativas de texto de imágenes. No hay auditoría WCAG ejecutada. | Pendiente de prueba |

## Corrección preparada en esta rama

Se añadió `<meta name="robots" content="noindex, follow"/>` a las cinco páginas, exclusivamente para la **demo**. Una comparación fuente-a-fuente de cada archivo con `main` confirmó que no hay otra modificación en el HTML, excluyendo este documento.

**NO INTEGRAR AUTOMÁTICAMENTE:** esta rama no está publicada. Comprobar y revisar antes de integrar. Mantener `noindex` mientras el proyecto sea una demostración.

## Pendientes de comprobación

- Peticiones y respuestas HTTP reales de la demo, su estado de indexación y posibles 404.
- Lighthouse/PageSpeed, LCP, INP, CLS, recursos de red y costes de Tailwind CDN.
- Comparativas responsive reales a 375, 768, 1024 y 1440 px, menús, animaciones y ausencia de desbordes.
- Entrega real de solicitudes a un backend autorizado.
- Revisión íntegra de testimonios, claims y fotos frente a la web original.
- Selección del dominio definitivo, SEO de producción, canonical, Open Graph, sitemap, robots y redirecciones.

## Orden recomendado

1. Proteger la demo contra indexación y verificar el resultado en el HTML publicado.
2. Evitar confirmaciones engañosas en formularios hasta contar con backend; integrar envío real antes del lanzamiento.
3. Sacar imágenes Base64 del HTML, optimizar formatos/dimensiones y validar recortes.
4. Preparar compilación Tailwind estática en una rama y comparar visualmente antes de retirar el CDN.
5. Finalizar metadatos, SEO local verificado, accesibilidad y SEO de producción **solo cuando se apruebe el dominio final**.

**Regla de calidad:** el diseño aprobado, la información verificable y la interactividad existente no deben degradarse para perseguir puntuaciones.
