FROM node:12-alpine

RUN apk add --no-cache dumb-init

WORKDIR /workspace
RUN mkdir -p mysimplemysql8/lib && mkdir test

COPY ./lib /workspace/mysimplemysql8/lib
COPY package.json /workspace/mysimplemysql8
COPY ./test /workspace/test

WORKDIR /workspace/test

RUN npm init -y && npm install ../mysimplemysql8

ENTRYPOINT [ "dumb-init", "--" ]

CMD [ "node", "test.js" ]