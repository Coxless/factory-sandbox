# ステージングのイメージ。sakura-software-factory が main への push ごとにビルドし、
# docker compose で 127.0.0.1:3100 → コンテナの 3000 に公開する（読み取り専用・非 root で動く）
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
