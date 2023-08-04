"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const Helpers_1 = require("./Helpers");
const rabbitmq = 'amqp://localhost:5672';
const logger = (0, Helpers_1.createLogger)('М2 микросервис'); // Создаем экземпляр логгера
const processTask = async (task) => {
    logger.info(`Обработка задачи с id ${task.id}...`);
    const delay = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    const result = { result: `Результат обработки задания c id ${task.id}` };
    logger.info(`Задача с id ${task.id} обработана`);
    return result;
};
async function startConsumer() {
    try {
        const connection = await amqplib_1.default.connect(rabbitmq);
        const channel = await connection.createChannel();
        const queue = 'tasks';
        await channel.assertQueue(queue, { durable: true });
        await channel.consume(queue, async (msg) => {
            if (!msg)
                return;
            const task = JSON.parse(msg.content.toString());
            logger.info(`Получена задача с id ${task.id}`);
            const result = await processTask(task);
            // Отправить результат обработки обратно в replyTo очередь
            channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(result)), {
                persistent: true,
                correlationId: msg.properties.correlationId,
            });
            channel.ack(msg);
        });
    }
    catch (err) {
        logger.error('Ошибка:', err);
        throw err;
    }
}
startConsumer().then(() => {
    logger.info('microservice 2 start');
});
