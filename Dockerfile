FROM node:20.10-alpine AS builder

WORKDIR /app

# Install packages
RUN apk add --no-cache git

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Copy the necessary files
COPY . .

RUN yarn build

FROM node:20.10-alpine

WORKDIR /app

# Install packages
RUN apk add --no-cache sqlite dumb-init

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --production --frozen-lockfile

ENV NODE_ENV=production

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "dist/index.js"]
