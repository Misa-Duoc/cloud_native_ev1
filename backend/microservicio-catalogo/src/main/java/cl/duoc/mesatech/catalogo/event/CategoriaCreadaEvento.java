package cl.duoc.mesatech.catalogo.event;

public class CategoriaCreadaEvento {
    private String eventId;
    private String tipoEvento;
    private String fechaEvento;
    private Long categoriaId;
    private String nombre;

    public CategoriaCreadaEvento() {}

    public CategoriaCreadaEvento(String eventId, String tipoEvento,
                                 String fechaEvento, Long categoriaId, String nombre) {
        this.eventId = eventId;
        this.tipoEvento = tipoEvento;
        this.fechaEvento = fechaEvento;
        this.categoriaId = categoriaId;
        this.nombre = nombre;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getTipoEvento() {
        return tipoEvento;
    }

    public void setTipoEvento(String tipoEvento) {
        this.tipoEvento = tipoEvento;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getFechaEvento() {
        return fechaEvento;
    }

    public void setFechaEvento(String fechaEvento) {
        this.fechaEvento = fechaEvento;
    }
}
