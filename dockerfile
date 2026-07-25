# ---- Stage 1: build ---------------------------------------------------------
# node:24-alpine — matches the Node version used in CI.
FROM node@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS build

WORKDIR /app

# Install from the lockfile only, so the image can't drift from the pinned
# versions. Copied separately from the sources to keep this layer cacheable.
COPY package.json package-lock.json ./
# The build never launches a browser; karma's Chrome download is dead weight.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------
# nginx:alpine — serves the compiled bundle. The previous image ran
# `ng serve` (the Angular dev server) on 0.0.0.0, which is unhardened, serves
# source maps, and exposes an unauthenticated HMR websocket.
FROM nginx@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/angular/browser /usr/share/nginx/html

# Run unprivileged. Port 8080 (not 80) so no capability to bind a low port is
# needed; nginx's runtime dirs must be writable by the nginx user.
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
