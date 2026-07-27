# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:e39c77a1d840eccb0d90257c20a436d4e90447b92dcfc0e637b15a6f25f90fd8

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
