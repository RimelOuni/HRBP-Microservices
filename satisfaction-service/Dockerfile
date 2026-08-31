FROM node:20

WORKDIR /app

COPY package.json ./

RUN npm config set strict-ssl false && npm install --omit=dev

COPY . .

EXPOSE 3014

CMD ["node", "server.js"]