package cl.duoc.mesatech.catalogo.service;

import cl.duoc.mesatech.catalogo.dto.CrearCategoriaPeticion;
import cl.duoc.mesatech.catalogo.model.Categoria;
import cl.duoc.mesatech.catalogo.repository.CategoriaRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CatalogoServicio {

    private final CategoriaRepositorio categoriaRepositorio;

    public CatalogoServicio(CategoriaRepositorio categoriaRepositorio) {
        this.categoriaRepositorio = categoriaRepositorio;
    }

    public Categoria crearCategoria(CrearCategoriaPeticion peticion) {
        Categoria categoria = new Categoria();
        categoria.setNombre(peticion.getNombre());
        categoria.setDescripcion(peticion.getDescripcion());
        
        return categoriaRepositorio.save(categoria);
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepositorio.findAll();
    }

    public Optional<Categoria> buscarCategoria(Long id) {
        return categoriaRepositorio.findById(id);
    }
}