package cl.duoc.mesatech.catalogo.controller;

import cl.duoc.mesatech.catalogo.dto.CrearCategoriaPeticion;
import cl.duoc.mesatech.catalogo.model.Categoria;
import cl.duoc.mesatech.catalogo.publisher.CategoriaPublisher;
import cl.duoc.mesatech.catalogo.service.CatalogoServicio;
import jakarta.validation.Valid;
import org.springframework.amqp.AmqpException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalogo")
@Validated
public class CatalogoControlador {

    private final CatalogoServicio catalogoServicio;
    private final CategoriaPublisher categoriaPublisher;

    public CatalogoControlador(CatalogoServicio catalogoServicio,
                               CategoriaPublisher categoriaPublisher) {
        this.catalogoServicio = catalogoServicio;
        this.categoriaPublisher = categoriaPublisher;
    }

    @PostMapping
    public ResponseEntity<Object> crearCategoria(
            @Valid @RequestBody CrearCategoriaPeticion peticion) {

        // 1. Guardar: al volver de este método, la fila ya está confirmada en RDS Catálogo
        Categoria categoriaCreada = catalogoServicio.crearCategoria(peticion);

        // 2. Publicar DESPUÉS del guardado
        try {
            categoriaPublisher.publicarCategoriaCreada(categoriaCreada);
        } catch (AmqpException e) {
            // Respuesta controlada: la categoría quedó guardada, pero el evento no se confirmó
            Map<String, Object> cuerpo = new LinkedHashMap<>();
            cuerpo.put("mensaje", "La categoría se guardó en Catálogo (id "
                    + categoriaCreada.getId()
                    + "), pero no se pudo confirmar su publicación en RabbitMQ. "
                    + "No estará disponible en Solicitudes.");
            cuerpo.put("categoriaId", categoriaCreada.getId());
            cuerpo.put("publicado", false);
            cuerpo.put("detalle", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(cuerpo);
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoriaCreada);
    }

    @GetMapping
    public List<Categoria> listarCategorias() {
        return catalogoServicio.listarCategorias();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Categoria> buscarCategoria(
            @PathVariable Long id) {

        return catalogoServicio
                .buscarCategoria(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categoria> actualizarCategoria(
            @PathVariable Long id,
            @Valid @RequestBody CrearCategoriaPeticion peticion) {

        try {
            Categoria categoriaActualizada = catalogoServicio.actualizarCategoria(id, peticion);
            return ResponseEntity.ok(categoriaActualizada);
        } catch (RuntimeException e) {
            // devolvemos un 404
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable Long id) {
        try {
            catalogoServicio.eliminarCategoria(id);
            // Devuelve 204
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}