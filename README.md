# ⚽ El Rincón del 10 - Tienda Online de Camisetas y Accesorios de Fútbol

Sitio web oficial para el microemprendimiento **El Rincón del 10**, desarrollado con **HTML5, CSS3 moderno y JavaScript Vanilla** (sin dependencias pesadas ni frameworks, 100% responsivo y listo para usar).

---

## 🚀 Características Principales

1. **Diseño Visual Futbolero Premium**:
   - Paleta de colores inspirada en la mística de la camiseta 10: azul noche estadio, dorado campeón y acentos modernos.
   - Tipografía deportiva con fuentes de Google Fonts (*Montserrat*, *Oswald* y *Poppins*).
   - Iconografía completa con *Font Awesome 6*.
   - 100% Responsivo: Se adapta perfectamente a celulares, tablets y computadoras de escritorio.

2. **Catálogo Interactivo de Productos**:
   - Camisetas actuales de clubes y selecciones (Argentina 3 Estrellas, Real Madrid, Boca, River, Inter Miami, etc.).
   - Joyas retro de colección (Argentina 1994 Maradona, Brasil 1970 Pelé, Boca 1981, Barcelona Sextete).
   - Accesorios de alto rendimiento (Medias Grip antideslizantes, canilleras de fibra de carbono, botineros impermeables, pelotas termoselladas, cintas de capitán, guantes de arquero).
   - Búsqueda en vivo en tiempo real por nombre, tag o club.
   - Filtros por categoría y ordenamiento (por precio, rating, destacados y orden alfabético).
   - Selector dinámico de talles (S, M, L, XL, XXL).
   - Modal de Vista Rápida (*Quick View*) con información detallada de cada producto.

3. **⭐ "El Taller del 10" (Personalizador de Camisetas en Vivo)**:
   - Visualizador de espalda de camiseta en tiempo real.
   - Personalizá con tu propio nombre y número, o seleccioná los dorsales históricos con un solo clic (MESSI 10, MARADONA 10, RIQUELME 10, PELÉ 10, MODRIC 10).
   - Cambio de modelos de camisetas (Argentina Albiceleste, Argentina Black, Boca Azul y Oro, River Banda Roja, Black & Gold Edition).
   - Se agrega al carrito como un producto personalizado con su propio dorsal.

4. **Carrito de Compras y Checkout por WhatsApp**:
   - Carrito lateral deslizable (*Drawer*) con persistencia en `localStorage`.
   - Control de cantidades (+, -) y eliminación de productos.
   - Barra de progreso para **Envío Gratis** (se activa automáticamente superando el monto mínimo).
   - Sistema de cupones de descuento:
     - `RINCON10`: 10% de descuento.
     - `COMBO10`: 25% de descuento relámpago.
     - `ENVIOGRATIS`: Envío gratuito inmediato.
   - **Checkout Directo por WhatsApp**: Genera un mensaje formateado listo para enviar al número del negocio con el desglose del pedido (prendas, talles, números estampados y total).
   - Modal de compra online simulada con generación de ticket de pedido y número de seguimiento.

5. **Herramientas de Venta y Confianza**:
   - Sistema de Favoritos (*Wishlist*) con corazón interactivo y panel para guardar productos deseados.
   - Temporizador de Oferta Relámpago en vivo.
   - Modal con Tabla y Guía de Talles (medidas de sisa, largo y estatura recomendada).
   - Notificaciones flotantes tipo *Toast* con animaciones modernas.
   - Botón flotante directo a WhatsApp con tooltip animado.
   - Formulario de contacto y suscripción a novedades con cupón de regalo.

---

## 📁 Estructura del Proyecto

```text
elrincondel10/
├── index.html          # Estructura semántica, secciones y modales
├── README.md           # Documentación y guía de personalización
├── assets/
│   └── products/       # Ilustraciones vectoriales locales de cada camiseta y accesorio
├── css/
│   └── styles.css      # Estilos CSS, diseño responsivo, temas y animaciones
└── js/
    ├── products.js     # Base de datos local de camisetas y accesorios
    └── app.js          # Lógica interactiva (carrito, filtros, personalizador, etc.)
```

---

## 🛠️ Cómo Probar y Ejecutar la Página

1. No requiere instalación de Node.js ni servidores complejos.
2. Hacé doble clic en el archivo `index.html` para abrirlo directamente en tu navegador favorito (Chrome, Edge, Firefox, Brave, Safari).
3. O bien, si usás Visual Studio Code, hacé clic derecho en `index.html` y seleccioná **"Open with Live Server"**.

---

## ⚙️ Cómo Personalizar Tu Emprendimiento

### 1. Cambiar el número de WhatsApp:
En los archivos [index.html](file:///c:/Users/alumnos/elrincondel10/index.html) y [js/app.js](file:///c:/Users/alumnos/elrincondel10/js/app.js#L358), buscá el número de teléfono:
```javascript
// Tu número de WhatsApp configurado:
https://wa.me/5493757323681
```

### 2. Agregar o Modificar Productos y Precios:
Abrí [js/products.js](file:///c:/Users/alumnos/elrincondel10/js/products.js) y podés editar los precios, nombres, fotos y talles de cada producto en la lista `PRODUCTS`.

---

## 🔐 Panel Privado de Costos y Rentabilidad

El sitio incluye una sección exclusiva para la gestión financiera de tu microemprendimiento:
- **Acceso:** Hacé clic en **"Calculadora Costos"** en la barra superior o en el pie de página.
- **Seguridad:** Por privacidad, **la contraseña no se muestra en ninguna parte del panel**. Solo vos la conocés para ingresar.
- **Funcionalidad:**
  - **Costos Variables:** Carga por unidad (prenda lisa o tela base, estampado/vinilo, packaging, comisión de pasarela, envío).
  - **Costos Fijos Mensuales:** Alquiler, servicios/WiFi, publicidad, mantenimiento, sueldo o retiro personal.
  - **Cálculo Automático:** Devuelve el **Costo Total Unitario** prorrateado según las ventas mensuales estimadas.
  - **Simulador de Precios:** Elegí el margen de ganancia deseado (ej. 40%, 50%, 70%) para ver el precio de venta sugerido al público y la ganancia neta limpia por prenda.
  - **Punto de Equilibrio:** Calcula cuántas prendas necesitás vender al mes para cubrir todos tus costos fijos.
  - **Guardado y Exportación:** Guardá listas de costos en tu navegador o exportalas a formato CSV.

---
*Hecho con pasión por el fútbol para **El Rincón del 10**.*

