FROM cgr.dev/chainguard/go:latest-dev

USER root

# posix-libc-utils supplies getconf, which VS Code Server's check-requirements.sh
# calls at startup to detect the architecture — without it the server refuses
# to start with exit 127.
RUN apk add --no-cache nodejs npm git bash posix-libc-utils && \
    npm install -g @angular/cli

RUN adduser -D -u 1000 -s /bin/bash vscode

RUN mkdir -p /workspace/node_modules && chown -R 1000:1000 /workspace

USER vscode
WORKDIR /workspace
