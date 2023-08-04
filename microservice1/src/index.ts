import express from 'express';
import bodyParser from 'body-parser';
import amqp, { Message } from 'amqplib';
import { createLogger } from './Helpers';

interface Task {
  id: string;
}

const app = express();
const port = 3000;

const rabbitmq = 'amqp://rabbitmq';

const logger = createLogger('М1 микросервис'); // Создаем экземпляр логгера

app.use(bodyParser.json());
app.post('/process', async (req, res) => {
  const task: Task = req.body;

  try {
    logger.info(`Попытка подключения к RabbitMQ для задачи ${task.id}...`);
    const connection = await amqp.connect(rabbitmq);
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
    const resultMsg = await new Promise<Message | null>((resolve) => {
      channel.consume(resultQueue.queue, (msg) => {
        resolve(msg);
      });
    });

    if (resultMsg) {
      const result = JSON.parse(resultMsg.content.toString()) as Task;
      logger.info(`Получен результат для задачи ${task.id}:`, result);
      channel.ack(resultMsg);
      res.status(200).json(result);
    } else {
      logger.error(`No result received for task ${task.id}`);
      res.status(500).send('No result received');
    }
  } catch (error) {
    logger.error(`Internal Server Error for task ${task.id}:`, error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  logger.info(`М1 микросервис слушает порт ${port}`);
});