## Belgian API

[!NOTE] You must copy the .env.example as .env in order to start the project

### Install deps

```shell
# use pnpm
pnpm install
```

### Start dev

To start the entire project you can use this one-line command

```shell
# makefile
make dev
```

But if you don't have Make, use the following commands

```shell
# start docker env
docker compose -f dev.compose.yml up -d --wait

# apply migraiton
node ace migration:fresh

# start api and job listener
./dev.startup.sh
```

#### Technologies used

- **Adonis**: API Framework
- **MongoDB**: CSV storage
- **Postgres**: Used to store users, OAT and other internal data
- **Redis**: Internal synchronization (e.g. jobs)
