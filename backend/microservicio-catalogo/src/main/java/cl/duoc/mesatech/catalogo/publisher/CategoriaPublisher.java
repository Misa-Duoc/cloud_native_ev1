package cl.duoc.mesatech.catalogo.publisher;

import cl.duoc.mesatech.catalogo.config.RabbitMQConfig;
import cl.duoc.mesatech.catalogo.event.CategoriaCreadaEvento;
import cl.duoc.mesatech.catalogo.model.Categoria;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
public class CategoriaPublisher {

    private static final Logger log = LoggerFactory.getLogger(CategoriaPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public CategoriaPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publicarCategoriaCreada(Categoria categoria) {

        CategoriaCreadaEvento evento = new CategoriaCreadaEvento(
                UUID.randomUUID().toString(),   // eventId: único en cada publicación
                "CATEGORIA_CREADA",
                Instant.now().toString(),
                categoria.getId(),
                categoria.getNombre()
        );

        CorrelationData correlationData = new CorrelationData(evento.getEventId());

        log.info("[Catalogo] Publicando evento: eventId={} categoriaId={} nombre='{}' exchange={} routingKey={}",
                evento.getEventId(), evento.getCategoriaId(), evento.getNombre(),
                RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY,
                    evento,
                    message -> {
                        message.getMessageProperties()
                                .setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        message.getMessageProperties()
                                .setMessageId(evento.getEventId());
                        return message;
                    },
                    correlationData
            );

            CorrelationData.Confirm confirm =
                    correlationData.getFuture().get(10, TimeUnit.SECONDS);


            if (!confirm.ack()) {
                throw new AmqpException(
                        "RabbitMQ no confirmó la publicación: " + confirm.reason());
            }


            if (correlationData.getReturned() != null) {
                throw new AmqpException(
                        "RabbitMQ no pudo dirigir el mensaje a la cola");
            }

            log.info("[Catalogo] Evento confirmado por RabbitMQ (ack): eventId={} categoriaId={}",
                    evento.getEventId(), evento.getCategoriaId());

        } catch (AmqpException e) {

            log.error("[Catalogo] Publicacion NO confirmada: eventId={} categoriaId={} motivo={}",
                    evento.getEventId(), evento.getCategoriaId(), e.getMessage());
            throw e;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[Catalogo] Confirmacion interrumpida: eventId={} categoriaId={}",
                    evento.getEventId(), evento.getCategoriaId());
            throw new AmqpException("Se interrumpió la confirmación", e);

        } catch (ExecutionException | TimeoutException e) {
            log.error("[Catalogo] Sin confirmacion de RabbitMQ: eventId={} categoriaId={} motivo={}",
                    evento.getEventId(), evento.getCategoriaId(), e.getMessage());
            throw new AmqpException("No se confirmó la publicación", e);
        }
    }
}