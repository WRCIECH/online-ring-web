# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json && npm install

COPY . .
RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Railway injects $PORT at runtime; substitute it into the nginx config
CMD ["/bin/sh", "-c", \
  "sed -i 's/__PORT__/'\"${PORT:-8080}\"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
