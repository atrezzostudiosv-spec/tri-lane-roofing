# Tri-Lane — Fase 7: contacto y conversión (intermedio seguro)

Fecha: 2026-10-22
Rama: `optimization-contact-truthful-fallback-20261022`

## Hallazgos confirmados
- La demo de GitHub Pages es estática. El archivo `assets/js/site.js` carecía de una petición o integración de envío en `handleContactSubmit` y `submitWizardInquiry`.
- Antes del cambio, ambas rutas validaban datos localmente y mostraban mensajes ambiguos que podían parecer confirmaciones de solicitud recibida.
- La página original https://trilaneroofing.com/contact publica el teléfono DFW (817) 717-3997. No existe un correo receptor ni endpoint de formulario confirmado para integrar directamente. No usar servicios de terceros sin autorización.
- El formulario de Contact tenía `required` en teléfono Y correo, pero la validación personalizada solo exigía uno u otro.

## Cambios propuestos en rama
- Mantener la estructura de formularios y el asistente; aclarar **antes de introducir datos** que la demo no entrega solicitudes.
- Sustituir mensajes de supuesto envío por un resumen local editable solo mediante los campos originales y **copiable**.
- Añadir alternativas claras: visitar la página de contacto oficial (abre pestaña aparte), llamar al número DFW confirmado.
- Validar teléfono O correo en Contact (al menos uno); mantener nombre, servicio y descripción del proyecto obligatorios.
- El asistente guiado usa una acción final más breve: «Review Options».
- Los valores introducidos se insertan con `textContent` y `textarea.value`, no con interpolaciones HTML, para reducir riesgo de inyección.
- Cambiar el número de versión del JS en las cinco páginas para evitar caché antigua. No modificar CSS ni arquitectura.
- No instalar servicios, insertar credenciales, hacer peticiones de red ni guardar datos personales en almacenamiento local.

## Pruebas realizadas
1. Sintaxis del `site.js` cargado en rama: analizador JavaScript V8 **aprobado**.
2. Test simulado de formulario válido con email y sin teléfono: preparación de texto **aprobada**.
3. Test de copia al portapapeles en entorno simulado: **aprobado**.
4. Verificación de enlaces: teléfono `tel:8177173997` y `https://trilaneroofing.com/contact`, **aprobado**.
5. Test de valores literales con texto similar a HTML: colocados en `textarea.value` sin `innerHTML`, **aprobado**.
6. Test de ambos contactos ausentes: error explícito, sin solicitud enviada y sin mostrar el resumen previo, **aprobado**.
7. Comparación HTML: Home, About, Services y Gallery solo cambian la referencia de versión del JS; mantienen H1 y noindex. Contact modifica únicamente microcopy/validación/aviso dentro del bloque de contacto y la referencia JS.

## No comprobado
- Recepción real de correos/solicitudes: **no implementada**, falta servicio receptor y autorización de negocio.
- Navegador real: click, teclado, lector de pantalla, clipboard permissions y responsive 375/768/1024/1440.
- Lighthouse/Core Web Vitals.

## Condiciones antes de producción
1. El cliente aprueba destinatario/cuenta receptora y herramienta de envío (p. ej., un proveedor de formularios o un endpoint propio).
2. Probar servidor/backend en un entorno seguro y verificar entrega real, errores, antispam y protección de datos.
3. Sustituir el flujo de copia por confirmación real **solo después** de respuesta de éxito verificada.
4. Aprobar política de privacidad aplicable.
5. Realizar pruebas visuales y funcionales y desplegar con autorización.

**Esta mejora provisional NO significa que el formulario ya envíe mensajes. No debe etiquetarse como completamente funcional ni publicarse como sitio oficial.**
