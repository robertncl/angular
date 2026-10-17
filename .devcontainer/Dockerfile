# 24-trixie
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:7e6eff9f0cac7f1d4d1836a7bd2a9011d8ea244fceb155261705be483218ea18

RUN npm install -g @angular/cli@22.2.2

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
