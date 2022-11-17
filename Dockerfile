FROM node
RUN apt-get upgrade && apt-get update -y
WORKDIR /bot
COPY package.json package.json
RUN yarn install
COPY . .
ENTRYPOINT ["node"]
CMD ["index.mjs"]
