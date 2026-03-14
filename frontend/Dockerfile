FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_MACHINE_URL
ARG VITE_SCHEDULER_URL
ARG VITE_ALERT_URL
ENV VITE_MACHINE_URL=$VITE_MACHINE_URL
ENV VITE_SCHEDULER_URL=$VITE_SCHEDULER_URL
ENV VITE_ALERT_URL=$VITE_ALERT_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]