# ---------- base ----------
FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies for Tesseract
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng

COPY package*.json ./
RUN npm install --production

COPY . .

# ---------- production ----------
FROM base AS production

ENV NODE_ENV=production
EXPOSE 5001

RUN mkdir -p logs

CMD ["npm", "start"]
