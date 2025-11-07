FROM node:20-alpine

RUN npm install -g pm2

WORKDIR /app

# Copy pre-built application
COPY dist/apps/gateway ./dist
COPY apps/gateway/package.json .
COPY apps/gateway/node_modules ./node_modules

CMD ["pm2-runtime", "start", "dist/main.js", "--name", "gateway"]
