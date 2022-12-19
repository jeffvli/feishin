./wait-for-it.sh db:$1 --timeout=20 --strict -- echo "db is up"

npx prisma migrate deploy
npx ts-node prisma/seed.ts
pm2-runtime server.js
