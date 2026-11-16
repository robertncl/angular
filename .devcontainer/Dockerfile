# 24-trixie
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:375f1ba34dab874ae487acb0b2bb3e9fd1b67fe3ea6e80c16e35713487f47c6a

RUN npm install -g @angular/cli@22.2.5

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
