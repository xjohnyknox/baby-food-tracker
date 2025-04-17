# Etapa de construcción
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Crear directorios de componentes UI si no existen
RUN mkdir -p components/ui

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS runner

# Establecer variables de entorno para producción
ENV NODE_ENV=production

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Cambiar propiedad de los archivos al usuario nextjs
RUN chown -R nextjs:nodejs /app

# Cambiar al usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Establecer variables de entorno para el host y puerto
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]

