import { Pool } from 'pg';

console.log('ENV PGUSER:', process.env.POSTGRES_USER);

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: String(process.env.POSTGRES_PASSWORD),
    port: Number(process.env.POSTGRES_PORT),
});

pool.connect()
  .then(client => {
    console.log('✅ Подключение к БД успешно!');
    client.release();
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к БД:', err);
  });

export default pool;