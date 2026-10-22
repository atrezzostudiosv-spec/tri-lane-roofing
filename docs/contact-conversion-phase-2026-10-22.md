# Tri-Lane — Formularios de prueba con entrega por correo

Fecha: 2026-10-22
Rama: `optimization-contact-truthful-fallback-20261022`

## Destino TEMPORAL autorizado
- **Correo de pruebas:** atrezzostudiosv@gmail.com
- **Proveedor externo:** FormSubmit.co, endpoint AJAX `https://formsubmit.co/ajax/atrezzostudiosv@gmail.com`
- **Objetivo:** comprobar que los dos formularios de la demo pueden generar correos que llegan al buzón de pruebas.
- **No es el destinatario final del cliente** ni constituye autorización de puesta en producción.

## Formularios conectados
1. **Contact:** nombre, teléfono o correo, ciudad/ZIP, servicio y descripción; validación en el navegador y JavaScript; honeypot.
2. **Asistente de solicitud** en todas las páginas: nombre y contacto, servicio, tipo de solicitud, notas, ciudad y ZIP; honeypot insertado al abrir.
3. Ambos comparten la misma constante `TRILANE_FORM_TEST_EMAIL` en `assets/js/site.js`. Para cambiar a la dirección del cliente: sustituir ese dato **después de aprobación**, ejecutar una nueva activación de FormSubmit y repetir pruebas completas.
4. Los mensajes de test se envían mediante `fetch` con `POST` JSON; no se abandona la página.

## Seguridad y comunicación
- La demo indica antes de completar el formulario que los mensajes se dirigen a Atrezzo, no al negocio.
- Pedir **solo datos ficticios de prueba** y no utilizar detalles sensibles.
- FormSubmit es un tercero que procesa formularios (su documentación indica conservación de envíos durante 30 días). Requiere políticas de privacidad y aprobación antes de operar con clientes reales.
- La lógica exige `response.ok` y `result.success === true || result.success === 'true'`. Un `"false"` como cadena no puede ser interpretado como envío exitoso.
- Incluso tras la respuesta positiva, el mensaje dice **«accepted by the form service»**, no «email received»: se debe comprobar Gmail.
- Ante rechazo, activación pendiente o fallo de red, no afirma entrega; ofrece resumen copiable y los canales oficiales existentes.
- Desactiva el botón durante la petición para prevenir duplicados.

## Pruebas realizadas
- Parseo JS con motor V8, correcto.
- Pruebas simuladas con respuestas AJAX: `success:"true"`, `success:"false"` por activación, `success:"false"` genérico y excepción de red, correcto.
- Payload de Contact enviado al endpoint esperado con `POST`/JSON, solo en simulación.
- Payload del asistente con nombre, correo, servicio, tipo, ciudad, ZIP y texto de la consulta, correcto en simulación.
- Se restauran los botones y se usan `textContent`/`textarea.value` (sin introducir datos de usuario como HTML).
- Se preservan CSS, imágenes, H1, `noindex`, navegación y estructura de los formularios.

## Pruebas que AÚN faltan
1. Abrir la **demo de GitHub Pages** desde navegador real (no un archivo local) y enviar una solicitud con información ficticia.
2. Revisar `atrezzostudiosv@gmail.com` (también Spam) para el correo de activación de FormSubmit. **Abrir y confirmar** el enlace de activación.
3. Volver al formulario y enviar **una segunda prueba ficticia** desde Contact y otra desde el asistente.
4. Verificar realmente la llegada de ambos mensajes, campos y Reply-To cuando haya correo, y contrastar con la respuesta mostrada.
5. Probar errores, dispositivo móvil/tablet, tecnologías de asistencia, seguridad, antispam y protección de datos.
6. Sustituir el correo de pruebas por el destinatario aprobado por Tri-Lane y **activar y repetir las pruebas** de ese destino.

**No se ha emitido ninguna petición POST real desde estas herramientas.** No afirmar entrega hasta verificarla en Gmail.

## Fuentes técnicas
- https://formsubmit.co/documentation
- https://formsubmit.co/ajax-documentation
- https://formsubmit.co/help
- https://formsubmit.co/privacy.pdf
