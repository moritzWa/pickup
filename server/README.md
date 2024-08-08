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

### Docker & Server

We use pgvector for vector storage. For that we need to use a custom docker image.

Pull the [pgvector PostgreSQL Docker image](https://hub.docker.com/r/pgvector/pgvector):

```
docker pull pgvector/pgvector:pg16
```

Start Docker locally

Run the following command from the root directory:

```console
docker compose -f deployments/pickup/docker-compose.yml up
```

If you want to stop and remove the containers:

```console
docker compose -f deployments/pickup/docker-compose.yml down
```

go back to the server directory and run the migrations now that postgres is up (in the docker container)

Acquire the .env files for server and frontend copy them into the server and web directories.

```console
npm run install:all
npm run migrate:run
```

If you make a change to the schema you can create a new migration with:

```console
npm run migrate:generate ./src/migrations/account-sub-types
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
npx inngest-cli@latest dev -u http://localhost:8001/inngest
```

### App

change to the app directory

run this to launch the app in a simulator

```console
npm run start
```

and choose your platform

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
