# Anvil Web
Anvil Web is a web interface for [Anvil Projects](https://github.com/tls-attacker/Anvil-Core). It is capable of starting tests and analysing the results in realtime or after the test is finished.

## Supported Projects
Currently Anvil Web supports only the following application specific implementations of Anvil Core:
 - [TLS-Anvil](https://github.com/tls-attacker/TLS-Anvil)

## Building
### Docker (recommanded)
This project is easiest built by using the supplied Dockerfile.
To build Anvil Web simply run
``` sh
docker build -t anvil-web .
```
The resulting docker container can be run separately, but we recommand using the supplied docker compose file, since it needs a mongodb and an environment variable `PRODUCTION=1` so it also serves the frontend. More information can be found under "Running".
### Manualy
You will need:
 - Node.js

Build steps
1. Build the frontend
   1. `cd frontend`
   2. `npm install`
   3. `npm run build`
2. Build the backend
   1. `cd backend`
   2. `npm install`
   3. `npm run build`
3. copy the frontend into the backend folder
   - `cp -r frontend/dist backend/static`

## Running
### Docker Compose (recommanded)
Anvil Web comes with a compose file, that has the web ui, mongodb and a TLS-Anvil worker ready to go. To use it you can run:
```
docker compose up -d
```
After starting, the web interface is acessible via http://localhost:5000/

### Docker
Anvil Web needs a mongodb database to run.
The create the database using docker you can use the commands
```
docker network create tlsanvil
docker run --network tlsanvil mongo
```
To start anvil web using docker you can then run
```
docker run -network tlsanvil -e PRODUCTION=1 -p 5000:5000 anvil-web
```
After starting, the web interface is acessible via http://localhost:5000/
The backend runs on the same port.

### Manually / Development environment
Starting the app manually will need a mongo db instance running.
You can start the frontend and backend seperatly. The backend is started by running `npm run start`, but only if you built it beforehand. The frontend is started in develpment mode using `npm run dev`.
The backend is started on port 5000 per default. The frontend will run on port 5173.

### Adding a worker client
To add a worker client connected to the backend, you can run your anvil project in worker mode. As an example, here is how you would start TLS-Anvil:
```
java -jar TLS-Testsuite.jar worker -connect [hostname-of-backend]:[port-of-backend]
```