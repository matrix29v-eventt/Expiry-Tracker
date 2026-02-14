# ---------- base ----------
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ---------- production ----------
FROM node:20-alpine AS production

WORKDIR /app
COPY --from=base /app .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
