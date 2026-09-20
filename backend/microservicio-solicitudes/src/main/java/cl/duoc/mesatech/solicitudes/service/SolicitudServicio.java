package cl.duoc.mesatech.solicitudes.service;

import cl.duoc.mesatech.solicitudes.dto.CrearSolicitudPeticion;
import cl.duoc.mesatech.solicitudes.model.Solicitud;
import cl.duoc.mesatech.solicitudes.repository.SolicitudRepositorio;
import cl.duoc.mesatech.solicitudes.model.EstadoSolicitud;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SolicitudServicio {

    private final SolicitudRepositorio solicitudRepositorio;

    public SolicitudServicio(SolicitudRepositorio solicitudRepositorio) {
        this.solicitudRepositorio = solicitudRepositorio;
    }

    public Solicitud crearSolicitud(
            CrearSolicitudPeticion peticion,
            String usuario) {

        Solicitud solicitud = new Solicitud();

        solicitud.setTitulo(peticion.getTitulo().trim());
        solicitud.setDescripcion(peticion.getDescripcion().trim());
        solicitud.setCategoriaId(peticion.getCategoriaId());
        solicitud.setCategoriaNombre(
                peticion.getCategoriaNombre().trim());
        solicitud.setPrioridad(peticion.getPrioridad());
        solicitud.setUsuario(usuario.trim());

        return solicitudRepositorio.save(solicitud);
    }

    public List<Solicitud> listarSolicitudesDelUsuario(String usuario) {
        return solicitudRepositorio
                .findByUsuarioOrderByFechaCreacionDesc(usuario.trim());
    }

    public Optional<Solicitud> buscarSolicitud(
            Long id,
            String usuario) {

        return solicitudRepositorio
                .findByIdAndUsuario(id, usuario.trim());
    }

    public List<Solicitud> listarTodasLasSolicitudes() {
        return solicitudRepositorio
                .findAllByOrderByFechaCreacionDesc();
    }

    public Optional<Solicitud> actualizarEstado(
            Long id,
            EstadoSolicitud estado) {

        return solicitudRepositorio
                .findById(id)
                .map(solicitud -> {
                    solicitud.setEstado(estado);
                    return solicitudRepositorio.save(solicitud);
                });
    }
}