# Микросервисы на Node.js Express с использованием RabbitMQ через Docker

Этот репозиторий содержит пример настройки микросервисов на Node.js Express, которые взаимодействуют друг с другом с использованием RabbitMQ в качестве брокера сообщений. Микросервисы разворачиваются в Docker контейнерах для удобства разработки и тестирования.

## Подготовка

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Запуск

1. Клонируйте этот репозиторий:

```
git clone <repository_url>
```

2. Измените файл `.env`. Настройте переменные среды по необходимости.

3. Запустите микросервисы и контейнеры RabbitMQ:

```
docker-compose up
```

Это запустит микросервисы и RabbitMQ в контейнерах Docker.

## Использование

1. Микросервис 1 будет доступен по умолчанию по адресу [http://localhost:3000](http://localhost:3000).

2. Веб-интерфейс управления RabbitMQ будет доступен по умолчанию по адресу [http://localhost:15672](http://localhost:15672). (Имя пользователя: `guest`, Пароль: `guest`)