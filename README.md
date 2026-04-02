#Святозар Мазур 222 навчальна група Варіянт 2 (два)

## Структура

```
├── src/
│   ├── web1/
│   │   └── index.html
│   └── web2/
│       └── index.html
├── services/
│   ├── service1.js
│   └── service2.js
├── docker-compose.yml
├── Dockerfile.service1
├── Dockerfile.service2
├── rabbitmq.conf
├── package.json
├── .env
└── README.md
```

## Запуск

### Варіант 1: Docker Compose
```bash
docker-compose up -d
```

### Варіант 2: Локально
```bash
npm install
npm run service1  # в одному терміналі
npm run service2  # в іншому терміналі
```

## URL

- Service 1: http://localhost:3001
- Service 2: http://localhost:3002
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## API

### POST /connect
Підключення до RabbitMQ

### POST /send
Відправка повідомлення

Body: `{"routingKey":"user.created","message":"..."}`

### GET /listen
Server-Sent Events для отримання повідомлень

## RabbitMQ

- Exchange: `events` (topic)
- Pattern: `user.*`
- Queue 1: `service1_queue`
- Queue 2: `service2_queue`

## Зупинка

```bash
docker-compose down
```
