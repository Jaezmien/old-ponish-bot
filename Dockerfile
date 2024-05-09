FROM node:18.18.2-alpine

WORKDIR /app

# Install packages
RUN apk add --no-cache git sqlite dumb-init

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Copy the necessary files
COPY . .

RUN yarn build

ENV NODE_ENV=production

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "dist/index.js"]
