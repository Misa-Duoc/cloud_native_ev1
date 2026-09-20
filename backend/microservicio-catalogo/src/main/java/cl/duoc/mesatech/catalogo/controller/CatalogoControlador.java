package cl.duoc.mesatech.catalogo.controller;

import cl.duoc.mesatech.catalogo.dto.CrearCategoriaPeticion;
import cl.duoc.mesatech.catalogo.model.Categoria;
import cl.duoc.mesatech.catalogo.service.CatalogoServicio;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
@Validated
public class CatalogoControlador {

    private final CatalogoServicio catalogoServicio;

    public CatalogoControlador(CatalogoServicio catalogoServicio) {
        this.catalogoServicio = catalogoServicio;
    }

    @PostMapping("/categorias")
    public ResponseEntity<Categoria> crearCategoria(
            @Valid 
            @RequestBody 
            CrearCategoriaPeticion peticion) {

        Categoria categoriaCreada = catalogoServicio.crearCategoria(peticion);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoriaCreada);
    }

    @GetMapping("/categorias")
    public List<Categoria> listarCategorias() {
        return catalogoServicio.listarCategorias();
    }

    @GetMapping("/categorias/{id}")
    public ResponseEntity<Categoria> buscarCategoria(
            @PathVariable Long id) {

        return catalogoServicio
                .buscarCategoria(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/categorias/{id}")
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

    @DeleteMapping("/categorias/{id}")
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