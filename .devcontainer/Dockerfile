# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:757b22963a35e3673da4bece29c4948c815637085947259b80910e951e3ba64a

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
