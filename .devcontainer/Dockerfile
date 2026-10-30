# 24-trixie
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:2015e2c863cb1e608bc0876860dd063cdb9e3d9a02dca63d1c2fce8fad02d088

RUN npm install -g @angular/cli@22.2.5

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
