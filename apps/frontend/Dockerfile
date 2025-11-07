FROM node:20-alpine

RUN npm install -g pm2

WORKDIR /app

# Copy pre-built Next.js application
COPY apps/frontend/.next ./.next
COPY apps/frontend/public ./public
COPY apps/frontend/package.json .
COPY apps/frontend/node_modules ./node_modules

ENV NODE_ENV=production

CMD ["pm2-runtime", "start", "npm", "--name", "frontend", "--", "start"]
