package cl.duoc.mesatech.solicitudes.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CategoriaEventoConsumidor {

    // Escucha la cola especificada en la infraestructura AWS: solicitudes.catalogo.queue
    @RabbitListener(queues = "solicitudes.catalogo.queue")
    public void recibirEventoCategoriaCreada(Map<String, Object> categoria) {
        System.out.println("-> [RabbitMQ - Solicitudes] Categoría recibida: " + categoria.get("nombre"));
    }
}