# Quincena · APP-FINANZAS

Aplicación personal para Nicaragua, diseñada para celular. React + Vite, almacenamiento local y sincronización opcional con Supabase.

## Desarrollo

Requiere Node.js 22 o superior (validado con Node.js 24).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
```

La app comienza vacía. Configura tu salario en **Configuración**, registra gastos y programa deudas. Cambia de quincena para revisar cuotas y disponible. Cada deuda representa el total pendiente, incluidos intereses pactados, dividido entre el número de quincenas indicado; no calcula intereses bancarios. El calendario de cuotas **no confirma pagos reales**. Los gastos solo afectan la quincena de su fecha. El disponible no representa el saldo conciliado de una cuenta bancaria; no incluye ahorro inicial o ingresos adicionales. Las proyecciones restan cuotas programadas al salario neto y excluyen gastos futuros.

## Supabase: usar los mismos datos en varios dispositivos

1. Crea tu proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` en su editor SQL. Activa aislamiento por usuario mediante RLS.
3. Copia `.env.example` a `.env.local` y coloca la URL del proyecto y su clave **pública anon o publishable**. Nunca uses una clave `service_role`, secreta o de administración en el frontend.
4. En Supabase Authentication, configura Site URL y Redirect URLs con el dominio HTTPS donde publiques la app. Configura el envío de correos para tu uso real.
5. Reinicia el servidor o recompila la app después de establecer `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
6. En **Conectar cuenta**, solicita tu enlace de acceso por correo. Entra con la misma cuenta en cada dispositivo.

Sin estas variables, la app funciona en modo local, sin sincronización. Los datos locales no se importan automáticamente a una cuenta: son espacios independientes. Los errores de guardado en la nube se muestran y no se anuncian como guardados. Evita usar el modo local en dispositivos compartidos. El acceso con correo y las políticas RLS requieren comprobación con un proyecto real antes de usar datos sensibles.

## Android y publicación

Publica el sitio en un alojamiento HTTPS compatible con Vite (por ejemplo, Vercel o Netlify): comando `npm run build`, carpeta de salida `dist`. Configura las dos variables públicas de Supabase en el alojamiento y las URL de autenticación correspondientes. Desde Chrome en Android, usa **Añadir a pantalla de inicio / Instalar aplicación** según la versión del navegador. Incluye manifest y modo standalone; no es un APK ni una publicación en Google Play y no ofrece sincronización sin conexión. No contiene conexión a bancos.

## INSS e IR: estimaciones pendientes de verificar

La app utiliza parámetros de referencia: INSS laboral 7 % y tabla anual de IR de 0 / 15 / 20 / 25 / 30 %, con límites de C$100,000, C$200,000, C$350,000 y C$500,000. Referencias a verificar: Ley 822 de Concertación Tributaria, artículo 23, y Decreto 06-2019 de reforma al Reglamento de la Ley de Seguridad Social.

**No se pudo comprobar la vigencia en fuentes oficiales durante esta implementación**: los dominios de INSS, DGI y Asamblea rechazaron el acceso de red. No se afirma cumplimiento de legislación actual. Antes de usar el resultado para decisiones salariales, contrasta parámetros y método con normativa vigente y tu comprobante de nómina. INSS, bases y tasas son editables en Configuración; los límites requieren ajustar `src/finance.js` si cambia la tabla legal.

Se estima el IR anualizando el salario mensual menos INSS, aplicando la tabla progresiva y dividiendo entre doce. Los importes mensuales se reparten entre las dos quincenas, conciliando los centavos en la segunda. Solo cubre salario mensual fijo bajo régimen general: no incluye bonos, salario variable, ajustes acumulados de retención, prestaciones ni regímenes especiales. Las deudas personales no reducen la base del IR. No sustituye una liquidación oficial.

## Validación

`npm test` verifica tramos de IR, INSS, salario inválido, cuotas únicas y múltiples, cambio de año, disponible negativo y conciliación de centavos. La compilación valida el frontend. La sincronización, el envío de correos y el aislamiento RLS necesitan un proyecto Supabase real; no están validados contra un servidor en esta entrega.

## Planificación y experiencia móvil

- **Mi plan → Presupuesto**: límites por categoría para la quincena seleccionada, porcentaje consumido y aviso de exceso. Poner un límite en cero lo elimina. Definir un presupuesto no resta dinero.
- **Mi plan → Metas de ahorro**: metas personales, aportes y progreso. Cada aporte reduce el disponible de su quincena; no lo registres además como gasto. Puedes revertir un aporte. Eliminar una meta elimina sus aportes y restaura el disponible de las quincenas afectadas. No hay transferencias bancarias reales.
- **Resumen**: accesos rápidos, distribución de gastos por categoría y ahorro apartado. Los presupuestos son independientes en cada quincena.
- **Gastos**: búsqueda por texto, filtro por categoría.
- Los perfiles anteriores sin metas o presupuestos siguen siendo compatibles. Los nuevos datos usan el mismo perfil protegido por RLS en Supabase y no requieren una nueva tabla.

Supabase es la base de datos prevista; la conexión real todavía requiere configurar un proyecto. Las modificaciones simultáneas desde dos dispositivos usan el último perfil guardado; esta primera versión no combina ediciones concurrentes.

## Error de Vercel: `vite: command not found`

La app completa debe estar subida a la rama que despliega Vercel: `package.json`, `package-lock.json`, `index.html`, `src/`, `public/`, `vite.config.js` y `vercel.json`. Los archivos existentes solo en el entorno de desarrollo no llegan automáticamente a GitHub ni a Vercel.

`vercel.json` define instalación con `npm ci --include=dev`, compilación con `npm run build` y salida en `dist`. Esto incluye Vite aunque se excluyeran dependencias de desarrollo en la instalación anterior. Usa la raíz del repositorio como Root Directory y elimina overrides de instalación/compilación que contradigan estos valores. Tras subir el código, despliega el nuevo commit; para descartar dependencias antiguas, haz Redeploy sin reutilizar Build Cache.
