# Getting Started Development

### Postgres Port conflict

Either change postgres PORT or shut down any Postgres servers you might have running locally

### Migrations

find the following migration and uncomment

```sql
await queryRunner.query(
`            CREATE TABLE typeorm_metadata (
                "type" varchar(255) NOT NULL,
                "database" varchar(255) DEFAULT NULL,
                "schema" varchar(255) DEFAULT NULL,
                "table" varchar(255) DEFAULT NULL,
                "name" varchar(255) DEFAULT NULL,
                "value" text
            )
           `
);
```

### Docker

Start Docker locally

go to deployments/learning and edit docker-compose.yml

add the following to the zookeeper section

```json
environment:
  ZOOKEEPER_CLIENT_PORT: 2181
```

run

docker compose up

go back to the server directory and run the migrations now that postgres is up (in the docker container)

Acquire the .env files for server and frontend copy them into the server and web directories.

```console
npm run install:all
npm run migrate:generate ./src/migrations/account-sub-types
npm run migrate:run
```

in separate terminals run

run the server

```console
npm run start:dev
```

run the inngest server

```console
npm run inngest:dev
```

run the inngest

```console
npx inngest-cli@latest dev -u http://localhost:8000/inngest
```

change to the web directory

run

```console
yarn
```

```console
npm run start
```

go to

http://localhost:3000

and everything should be running

# How to use the Node.js Debugger in VS Code

https://www.loom.com/share/874739fc794d42c0939813afaa247db8

# How to add a migration with TypeOrm

You need the path to the filename

```shell
npm run migrate:create src/migrations/${filename}
```

Then add the info for the index in the correct entity file

Then run

```shell
npm run migrate:run
```
