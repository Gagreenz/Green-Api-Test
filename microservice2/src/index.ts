import amqp, { Channel, Connection, Message } from 'amqplib';
import { createLogger } from './Helpers';

const rabbitmq = 'amqp://rabbitmq';

interface Task {
  id: string;
}

const logger = createLogger('М2 микросервис'); // Создаем экземпляр логгера

const processTask = async (task: Task) => {
  logger.info(`Обработка задачи с id ${task.id}...`);
  
  const delay = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const result = { result: `Результат обработки задания c id ${task.id}` };
  logger.info(`Задача с id ${task.id} обработана`);
  
  return result;
};

async function startConsumer() {
  try {
    const connection: Connection = await amqp.connect(rabbitmq);
    const channel: Channel = await connection.createChannel();

    const queue = 'tasks';
    await channel.assertQueue(queue, { durable: true });

    await channel.consume(queue, async (msg: Message | null) => {
      if (!msg) return;
      const task: Task = JSON.parse(msg.content.toString());
      logger.info(`Получена задача с id ${task.id}`);
      
      const result = await processTask(task);

      // Отправить результат обработки обратно в replyTo очередь
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(result)),
        {
          persistent: true,
          correlationId: msg.properties.correlationId,
        }
      );

      channel.ack(msg);
    });
  } catch (err) {
    logger.error('Ошибка:', err);
    throw err;
  }
}

startConsumer().then(() => {
  logger.info('microservice 2 start');
});