package cl.duoc.mesatech.solicitudes.model;

import jakarta.persistence.*;

@Entity
@Table(name = "copias_categorias")
public class CopiaCategoria {

    @Id
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 2000)
    private String descripcion;

    public CopiaCategoria() {}

    public CopiaCategoria(Long id, String nombre, String descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}