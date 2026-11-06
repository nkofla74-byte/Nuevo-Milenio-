---
order: 2
title: El entorno de desarrollo
summary: Node.js, npm, nvm, el lockfile y la seguridad de las dependencias. Incluye el problema real que encontramos (Node roto) y cómo se resolvió sin tocar el sistema.
status: verificado
phase: Fase 1 — Cimientos
files:
  - package.json
  - package-lock.json
  - ~/.nvm/versions/node/v26.13.0/
quiz:
  - q: "¿Por qué necesitamos Node.js si el sitio final es HTML y no 'corre' Node en el navegador del visitante?"
  - q: "El Node del sistema decía 'libsimdjson.so.34: cannot open shared object file'. Explica con tus palabras qué significa ese error y por qué nvm lo evita."
  - q: "¿Qué diferencia hay entre package.json y package-lock.json? ¿Qué podría pasar en el servidor de despliegue si no existiera el lockfile?"
  - q: "¿Qué es un script postinstall y por qué es un riesgo de seguridad? ¿Qué revisé antes de aprobar los de esbuild y workerd?"
---

## Node.js: el motor de las herramientas

**Qué es:** un programa que ejecuta JavaScript **fuera del navegador**, directamente en tu computador o en un servidor.

**Por qué lo necesitamos:** Astro, Tailwind, Vite y casi todas las herramientas web modernas están escritas en JavaScript. Para que trabajen (compilar, generar el CSS, levantar el servidor de desarrollo) necesitan un "motor" que las ejecute. Ese motor es Node.

**Distinción clave:** Node lo usamos **para construir** el sitio. El visitante nunca ejecuta Node; recibe el HTML resultante. Es como la maquinaria de una obra: se usa para construir el edificio, pero no se entrega con él.

## npm: el gestor de paquetes

**Qué es:** la herramienta que viene con Node para descargar librerías (paquetes) desde el registro público npmjs.com.

**Cómo funciona por dentro:**

```
npm install gsap
   │
   ├─► consulta registry.npmjs.org: "¿cuál es la última versión de gsap?"
   ├─► descarga el paquete (un .tgz) y sus dependencias
   ├─► los descomprime en node_modules/gsap/
   ├─► anota "gsap": "^3.15.1" en package.json   (lo que QUIERES)
   └─► anota la versión exacta y su hash en package-lock.json   (lo que SE INSTALÓ)
```

### `package.json` y `package-lock.json`

Abre `package.json`. Verás:

```json
"dependencies": {
  "astro": "^7.4.7",
  "gsap": "^3.15.1"
}
```

El `^` significa "esta versión o una más nueva **compatible**" (misma versión mayor). Si mañana sale gsap 3.16.0, `npm install` podría instalarla.

`package-lock.json` registra **exactamente** qué se instaló (por ejemplo `3.15.1`) y un *hash* de integridad de cada archivo.

**Qué pasaría sin lockfile:** tu computador tiene gsap 3.15.1; el servidor de despliegue instala 3.16.0 tres semanas después, que trae un cambio sutil, y el sitio se rompe en producción aunque en tu máquina funcionaba. El famoso "en mi máquina sí funciona". Con el lockfile y `npm ci` (que instala *exactamente* lo del lock), ambos entornos son idénticos.

**Versiones verificadas, no supuestas.** Antes de instalar, consulté:

```bash
npm view astro version        # 7.4.7
npm view tailwindcss version  # 4.3.4
npm view gsap version         # 3.15.1
```

Si copias versiones de un tutorial viejo, terminas usando APIs que ya no existen. Además, revisé el código instalado de Astro (`node_modules/astro/dist/types/public/config.d.ts`) para confirmar cómo funcionan las fuentes y la CSP **en esta versión**. Leer la documentación de la versión que realmente tienes es un hábito profesional.

## El problema real: Node estaba roto

Al empezar, cualquier comando de Node fallaba:

```
node: error while loading shared libraries: libsimdjson.so.34: cannot open shared object file
```

**Qué significa, pieza por pieza:**
- Un programa compilado (Node) no trae todo su código adentro: usa **librerías compartidas** (`.so` en Linux, `.dll` en Windows) que viven en el sistema.
- Node se compiló esperando `libsimdjson.so.34`.
- Arch Linux actualizó `simdjson` y ahora el sistema tiene `libsimdjson.so.35`. La 34 ya no existe.
- Resultado: el programa no puede arrancar.

Es un desajuste típico de las distribuciones *rolling release*, que se actualizan de forma continua.

**Alternativas que había:**

| Opción | Ventaja | Desventaja |
|---|---|---|
| `sudo pacman -Syu` (actualizar todo el sistema) | Arreglo definitivo | Requiere sudo; afecta a todo el computador, no solo a este proyecto |
| **nvm: instalar Node en tu carpeta personal** | Sin sudo, aislado, cada proyecto con su versión | Una herramienta más |
| Usar Bun (estaba instalado) | Rápido | Compatibilidad no garantizada al 100% con Astro y Cloudflare |

Elegí **nvm**: descarga una versión oficial de Node, compilada de forma que no depende de esa librería del sistema, y la guarda en `~/.nvm/versions/node/v26.13.0/`.

**Un detalle más:** nvm se quejó de que tu archivo `~/.npmrc` tiene una opción `prefix` (para instalar paquetes globales en `~/.npm-global`). nvm sugería borrarla, pero eso es configuración tuya y no me correspondía cambiarla. En su lugar usé el Node de nvm directamente con `PATH`:

```bash
export PATH=~/.nvm/versions/node/v26.13.0/bin:$PATH
```

`PATH` es la lista ordenada de carpetas donde la terminal busca un programa cuando escribes su nombre. Al poner primero la carpeta de nvm, `node` encuentra el Node que funciona antes que el roto.

> **Para tus proyectos:** usa siempre un gestor de versiones (nvm, fnm o volta). Así, una actualización del sistema operativo no te rompe el trabajo, y puedes tener proyectos con versiones de Node distintas.

## Seguridad de la cadena de suministro: los scripts `postinstall`

Al instalar, npm 11 mostró:

```
npm warn install-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn install-scripts   workerd@1.20261104.1 (postinstall: node install.js)
```

**Qué es un postinstall:** un paquete puede declarar un programa que se ejecuta **automáticamente en tu computador apenas lo instalas**, con todos tus permisos.

**Por qué es peligroso:** así funcionan muchos ataques reales a la "cadena de suministro" (*supply chain*): alguien publica o secuestra un paquete y su postinstall roba tus llaves SSH, tokens o contraseñas. npm 11 ahora **bloquea esos scripts por defecto** y te pide aprobarlos.

**Qué revisé antes de aprobar:**

```bash
grep -o 'https\?://[^"]*' node_modules/esbuild/install.js
```

Este comando lista todas las URLs que aparecen en el script. Las dos herramientas solo descargan su binario nativo desde `registry.npmjs.org`:
- **esbuild:** el compilador ultrarrápido que usa Vite.
- **workerd:** el motor de Cloudflare Workers, para simular el backend en local.

Las dos son legítimas y necesarias, así que las aprobé con `npm install-scripts approve esbuild workerd`.

**Qué pasaría sin esta revisión:** nada malo esta vez, pero el hábito de aprobar todo sin mirar es justamente lo que aprovechan los atacantes. Tu prompt lo pide explícitamente (sección 10, A03:2025).
