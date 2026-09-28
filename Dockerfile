# syntax=docker/dockerfile:1

# ---- Build: compile and bundle the static site ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: skip lifecycle scripts (husky) and any dependency install scripts.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ---- Runtime: non-root nginx serving the files with security headers ----
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
LABEL org.opencontainers.image.title="cognitive-index" \
      org.opencontainers.image.description="Timed reasoning assessment scored on the IQ scale, served as a static site." \
      org.opencontainers.image.licenses="MIT"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
# The base image already runs as the unprivileged "nginx" user (uid 101); stated explicitly for auditors.
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
