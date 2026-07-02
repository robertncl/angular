# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:290765b625a6e000589283bde4c4f1cabf5de334187e29768451836d02de1309

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
