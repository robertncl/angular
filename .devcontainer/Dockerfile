# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:d3802a74f28b0b01cdf4688939565e048b57ff5366470323cd7fbc3760aaa429

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
