FROM node:20-alpine

RUN npm install -g pm2

WORKDIR /app

# Copy pre-built application
COPY dist/apps/video_feed_provider ./dist
COPY apps/video_feed_provider/package.json .
COPY apps/video_feed_provider/node_modules ./node_modules

CMD ["pm2-runtime", "start", "dist/main.js", "--name", "video-feed-provider"]
