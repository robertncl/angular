# ---- Stage 1: build ---------------------------------------------------------
# node:26-alpine, pinned as tag@digest: a bare `node@sha256:` gives Dependabot no
# tag to track, so it proposed node:latest (Debian) in #113. CI and the devcontainer
# run Node 24; Angular supports both (engines: ^24.15 || >=26).
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build

WORKDIR /app

# Install from the lockfile only, so the image can't drift from the pinned
# versions. Copied separately from the sources to keep this layer cacheable.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
    # Pre-compress text assets once, at maximum level, for nginx's gzip_static;
    # -k keeps the originals for clients that don't accept gzip.
    && find dist/angular/browser -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.txt' \) \
       -exec gzip -9 -k {} +

# ---- Stage 2: runtime -------------------------------------------------------
# nginx:alpine (tag@digest, see above; the bare digest had drifted to the
# Debian image, which has no wget, so the HEALTHCHECK below always failed)
# — serves the compiled bundle. The previous image ran
# `ng serve` (the Angular dev server) on 0.0.0.0, which is unhardened, serves
# source maps, and exposes an unauthenticated HMR websocket.
FROM nginx:alpine@sha256:713fc2ebfd92e8217db451477182ee91944b123d2b1ee9fd5a8c6e91ca6c3a11

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
