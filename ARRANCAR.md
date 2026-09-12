# Cómo arrancar el sistema

## 1. Configurar la API key 

Abrí `backend/.env` y reemplazá `tu_api_key_aqui` con tu API key real

## 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

## 3. Poblar la base de datos

```bash
npm run seed
```

Esto crea todas las tablas e inserta los 15 pasillos, estantes, divisorias, categorías y 20 productos de ejemplo.

## 4. Iniciar el backend

```bash
npm run dev
```

El backend corre en: http://localhost:3001

## 5. En otra terminal — instalar dependencias del frontend

```bash
cd frontend
npm install
```

## 6. Iniciar el frontend

```bash
npm run dev
```

La app corre en: http://localhost:5173

---

## Notas importantes

- La función de voz funciona en **Chrome** y **Edge** (requiere HTTPS en producción, en localhost funciona sin HTTPS).
- La base de datos ya debe estar creada (`Asistente_Apolo`) antes de correr el seed.
- Si necesitás resetear los datos, volvé a correr `npm run seed` desde la carpeta `backend`.
