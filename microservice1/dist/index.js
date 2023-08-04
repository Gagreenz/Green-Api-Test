"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const amqplib_1 = __importDefault(require("amqplib"));
const Helpers_1 = require("./Helpers");
const app = (0, express_1.default)();
const port = 3000;
const rabbitmq = 'amqp://localhost:5672';
const logger = (0, Helpers_1.createLogger)('М1 микросервис'); // Создаем экземпляр логгера
app.use(body_parser_1.default.json());
app.post('/process', async (req, res) => {
    const task = req.body;
    try {
        logger.info(`Попытка подключения к RabbitMQ для задачи ${task.id}...`);
        const connection = await amqplib_1.default.connect(rabbitmq);
        logger.info(`Успешное подключение к RabbitMQ для задачи ${task.id}`);
        logger.info(`Создание канала для задачи ${task.id}...`);
        const channel = await connection.createChannel();
        logger.info(`Канал создан для задачи ${task.id}`);
        const resultQueue = await channel.assertQueue('', { exclusive: true });
        logger.info(`Отправка задачи ${task.id} в очередь...`);
        channel.sendToQueue('tasks', Buffer.from(JSON.stringify(task)), {
            persistent: true,
            replyTo: resultQueue.queue,
        });
        logger.info(`Задача ${task.id} отправлена в очередь`);
        logger.info(`Ожидание результата для задачи ${task.id}...`);
        const resultMsg = await new Promise((resolve) => {
            channel.consume(resultQueue.queue, (msg) => {
                resolve(msg);
            });
        });
        if (resultMsg) {
            const result = JSON.parse(resultMsg.content.toString());
            logger.info(`Получен результат для задачи ${task.id}:`, result);
            channel.ack(resultMsg);
            res.status(200).json(result);
        }
        else {
            logger.error(`No result received for task ${task.id}`);
            res.status(500).send('No result received');
        }
    }
    catch (error) {
        logger.error(`Internal Server Error for task ${task.id}:`, error);
        res.status(500).send('Internal Server Error');
    }
});
app.listen(port, () => {
    logger.info(`М1 микросервис слушает порт ${port}`);
});
