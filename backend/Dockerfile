# syntax=docker/dockerfile:1
# SPDX-License-Identifier: Apache-2.0
ARG BUILD_IMAGE=node:20-bullseye
ARG RUN_IMAGE=gcr.io/distroless/nodejs20-debian11:nonroot

FROM ${BUILD_IMAGE} AS builder
LABEL stage=build
# TS -> JS stage

WORKDIR /home/app
COPY ./src ./src
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY .npmrc ./

RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN npm ci --ignore-scripts
RUN npm run build


FROM ${BUILD_IMAGE} AS dep-resolver
LABEL stage=pre-prod
# To filter out dev dependencies from final build

COPY package*.json ./
COPY .npmrc ./
RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN npm ci --ignore-scripts

FROM ${BUILD_IMAGE} AS rule-sources
LABEL stage=rule-sources
ARG RULE_TEMPLATE_REPO=https://github.com/tazama-lf/rule-studio-example.git
ARG RULE_TEMPLATE_REF=dev
ARG RULE_EXECUTER_REPO=https://github.com/tazama-lf/rule-executer.git
ARG RULE_EXECUTER_REF=fix/447-rule-studio-enrichment
RUN set -e; \
    fetch() { \
      git init -q "$3" && git -C "$3" fetch -q --depth 1 "$1" "$2" && git -C "$3" checkout -q FETCH_HEAD \
      && commit=$(git -C "$3" rev-parse HEAD) && lock=$(sha256sum "$3/package-lock.json" | cut -d' ' -f1) \
      && printf '{"repo":"%s","ref":"%s","commit":"%s","lockSha256":"%s"}' "$1" "$2" "$commit" "$lock" \
      && rm -rf "$3/.git"; \
    }; \
    template=$(fetch "${RULE_TEMPLATE_REPO}" "${RULE_TEMPLATE_REF}" /rule-pipeline/template); \
    executer=$(fetch "${RULE_EXECUTER_REPO}" "${RULE_EXECUTER_REF}" /rule-pipeline/executer); \
    printf '{"template":%s,"executer":%s}\n' "$template" "$executer" > /rule-pipeline/sources.json; \
    cat /rule-pipeline/sources.json

FROM ${RUN_IMAGE} AS run-env
USER nonroot

WORKDIR /home/app
COPY --from=dep-resolver /node_modules ./node_modules
COPY --from=builder /home/app/dist ./build
COPY --from=rule-sources /rule-pipeline ./rule-pipeline
COPY package.json ./

# Execute watchdog command
CMD ["build/main.js"]