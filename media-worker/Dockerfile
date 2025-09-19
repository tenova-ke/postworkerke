FROM node:18-slim

# install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000
CMD ["node", "index.js"]
