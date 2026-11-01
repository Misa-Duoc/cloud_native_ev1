package cl.duoc.mesatech.catalogo.publisher;

import cl.duoc.mesatech.catalogo.model.Categoria;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class CategoriaPublisher {

    private final RabbitTemplate rabbitTemplate;

    public CategoriaPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publicarCategoriaCreada(Categoria categoria) {
        rabbitTemplate.convertAndSend("catalogo.exchange", "categoria.creada.key", categoria);
        System.out.println("-> [RabbitMQ] Evento publicado desde Catálogo: " + categoria.getNombre());
    }
}