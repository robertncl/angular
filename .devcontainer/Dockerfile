FROM mcr.microsoft.com/devcontainers/typescript-node:24

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
