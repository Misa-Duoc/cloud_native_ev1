package cl.duoc.mesatech.catalogo.service;

import cl.duoc.mesatech.catalogo.dto.CrearCategoriaPeticion;
import cl.duoc.mesatech.catalogo.model.Categoria;
import cl.duoc.mesatech.catalogo.publisher.CategoriaPublisher;
import cl.duoc.mesatech.catalogo.repository.CategoriaRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CatalogoServicio {

    private final CategoriaRepositorio categoriaRepositorio;
    private final CategoriaPublisher categoriaPublisher;

    public CatalogoServicio(CategoriaRepositorio categoriaRepositorio, CategoriaPublisher categoriaPublisher) {
        this.categoriaRepositorio = categoriaRepositorio;
        this.categoriaPublisher = categoriaPublisher;
    }

    @Transactional
    public Categoria crearCategoria(CrearCategoriaPeticion peticion) {
        Categoria categoria = new Categoria();
        categoria.setNombre(peticion.getNombre());
        categoria.setDescripcion(peticion.getDescripcion());

        Categoria categoriaGuardada = categoriaRepositorio.save(categoria);

        try {
            categoriaPublisher.publicarCategoriaCreada(categoriaGuardada);
            System.out.println("-> [Catálogo] Evento publicado a RabbitMQ para ID: " + categoriaGuardada.getId());
        } catch (Exception e) {
            System.err.println("X [Catálogo] Error al enviar evento a RabbitMQ: " + e.getMessage());
        }

        return categoriaGuardada;
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepositorio.findAll();
    }

    public Optional<Categoria> buscarCategoria(Long id) {
        return categoriaRepositorio.findById(id);
    }

    @Transactional
    public Categoria actualizarCategoria(Long id, CrearCategoriaPeticion peticion) {
        Categoria categoriaExistente = categoriaRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con el ID: " + id));

        categoriaExistente.setNombre(peticion.getNombre());
        categoriaExistente.setDescripcion(peticion.getDescripcion());

        return categoriaRepositorio.save(categoriaExistente);
    }

    @Transactional
    public void eliminarCategoria(Long id) {
        if (!categoriaRepositorio.existsById(id)) {
            throw new RuntimeException("Categoría no encontrada con el ID: " + id);
        }
        categoriaRepositorio.deleteById(id);
    }
}