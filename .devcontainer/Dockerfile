# 24-trixie
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:56a7d5570b644ed88c4ab3529f46bd662d656ebe9e73de06076af91a75fa8f3e

RUN npm install -g @angular/cli@22.2.5

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
