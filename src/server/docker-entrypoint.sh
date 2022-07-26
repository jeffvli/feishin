
apk add --no-cache bash

./wait-for-it.sh db:$1 --timeout=20 --strict -- echo "db is up"

npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts

npm run dev
