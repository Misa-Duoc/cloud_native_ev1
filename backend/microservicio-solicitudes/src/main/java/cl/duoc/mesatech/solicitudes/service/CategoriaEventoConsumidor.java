package cl.duoc.mesatech.solicitudes.service;

import cl.duoc.mesatech.solicitudes.dto.CategoriaDTO;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class CategoriaEventoConsumidor {

    @RabbitListener(queues = "${rabbitmq.queue.name:categoria.creada.queue}")
    public void recibirCategoriaCreada(CategoriaDTO categoria) {
        System.out.println("[RabbitMQ] Evento recibido en las Solicitudes: " + categoria.getNombre());
    }
}