FROM node:23-alpine

ENV RXID=''
ENV RXKEY=''
ENV RXPORT=1607

WORKDIR /home/node

USER node

COPY --chown=node:node package*.json ./
RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

COPY --chown=node:node ./rxsrv.js ./
# COPY . .

EXPOSE $PORT

ENTRYPOINT ["./rxsrv.js"]

# CMD [ "./rxsrv.js" ]
