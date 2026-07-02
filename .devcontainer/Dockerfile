FROM mcr.microsoft.com/devcontainers/javascript-node:dev-22-bullseye

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
