# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:f42ce084bfbf78cd759d0b1635c882e88b36be45d55560786272bb852ac8c5a5

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
