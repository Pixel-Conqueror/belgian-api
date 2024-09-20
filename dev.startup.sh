#!/bin/bash

(trap 'kill 0' SIGINT; node ace queue:listen & pnpm run dev)

wait -n
exit $?
