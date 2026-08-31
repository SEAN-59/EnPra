FROM node:22-bookworm-slim

WORKDIR /app
RUN npm install --global @openai/codex@0.144.6

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

ENV ENPRA_DATA_DIR=/data
ENV PORT=8787
EXPOSE 8787

CMD ["npm", "run", "start"]
