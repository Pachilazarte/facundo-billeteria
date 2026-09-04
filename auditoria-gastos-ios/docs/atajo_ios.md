# Atajo de iOS - Ingreso de Efectivo Rápido

1. Abrí la app "Atajos" (Shortcuts) en tu iPhone.
2. Tocá el "+" para crear un atajo nuevo.
3. Nombre: "Cargar Efectivo" o "Gasto en Efectivo".

## Acciones a agregar:
1. **Solicitar entrada:**
   - Pedir: `Texto`
   - Prompt: `Monto y Concepto (ej: 1500 kiosco)`
2. **Dividir texto:**
   - Texto: `Entrada proporcionada`
   - Separador: `Espacios`
3. **Obtener elemento de la lista (1):**
   - Obtener `Primer elemento` de `Texto dividido`
   - (Esto va a ser el `Monto`)
   - Guárdalo en una variable llamada `Monto`.
4. **Obtener elemento de la lista (2):**
   - Obtener `Elementos en el rango` de `2` a `Final` de `Texto dividido`
   - (Esto va a ser el `Concepto`)
   - Uní esa lista con espacios.
   - Guárdalo en una variable llamada `Concepto`.
5. **Obtener contenido de URL:**
   - URL: `https://TU_DOMINIO_VERCEL.vercel.app/api/webhooks/gastos`
   - Método: `POST`
   - Encabezados:
     - `Authorization`: `Bearer TU_TOKEN_SECRETO`
   - Cuerpo de la petición (JSON):
     - `monto`: Texto -> Insertar variable `Monto`
     - `concepto`: Texto -> Insertar variable `Concepto`
     - `metodo_pago`: Texto -> `Efectivo`
     - `origen`: Texto -> `ios_shortcut`

¡Listo! Para usarlo sin clics, podés ir a **Configuración de iOS -> Accesibilidad -> Tocar -> Toque posterior (Back Tap)** y asignarlo a "Tocar 2 veces". Cuando gastes efectivo, tocás dos veces el celu, escribís "2500 café" y le das enter. Magia.
