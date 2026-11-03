package cl.duoc.mesatech.solicitudes.service;

import cl.duoc.mesatech.solicitudes.dto.CategoriaDTO;
import cl.duoc.mesatech.solicitudes.model.CopiaCategoria;
import cl.duoc.mesatech.solicitudes.repository.CopiaCategoriaRepositorio;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoriaEventoConsumidor {

    private final CopiaCategoriaRepositorio copiaCategoriaRepositorio;

    public CategoriaEventoConsumidor(CopiaCategoriaRepositorio copiaCategoriaRepositorio) {
        this.copiaCategoriaRepositorio = copiaCategoriaRepositorio;
    }

    @RabbitListener(queues = "${rabbitmq.queue.name:solicitudes.catalogo.queue}")
    @Transactional
    public void recibirCategoriaCreada(CategoriaDTO categoriaDto) {
        try {
            CopiaCategoria copiaCategoria = new CopiaCategoria(
                    categoriaDto.getId(),
                    categoriaDto.getNombre(),
                    categoriaDto.getDescripcion()
            );

            copiaCategoriaRepositorio.save(copiaCategoria);

            System.out.println("[RabbitMQ] Categoría sincronizada y guardada en RDS Solicitudes ID: " + categoriaDto.getId() + " - " + categoriaDto.getNombre());

        } catch (Exception e) {
            System.err.println("[RabbitMQ] Error al procesar o guardar la categoría recibida: " + e.getMessage());
            throw e;
        }
    }
}