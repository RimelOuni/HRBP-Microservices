FROM node:20

WORKDIR /app

COPY package.json ./

RUN npm config set strict-ssl false && npm install --omit=dev

COPY . .

EXPOSE 3015

CMD ["node", "server.js"]