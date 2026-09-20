package cl.duoc.api_cloud_native.controller;

import cl.duoc.api_cloud_native.service.SolicitudClienteServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudBffControlador {

    private final SolicitudClienteServicio solicitudClienteServicio;

    public SolicitudBffControlador(
            SolicitudClienteServicio solicitudClienteServicio) {

        this.solicitudClienteServicio = solicitudClienteServicio;
    }

    @PostMapping
    public ResponseEntity<Object> crearSolicitud(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> peticion) {

        return solicitudClienteServicio.crearSolicitud(
                obtenerUsuario(jwt),
                peticion);
    }

    @GetMapping
    public ResponseEntity<Object> listarSolicitudes(
            @AuthenticationPrincipal Jwt jwt) {

        return solicitudClienteServicio.listarSolicitudes(
                obtenerUsuario(jwt));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> buscarSolicitud(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return solicitudClienteServicio.buscarSolicitud(
                id,
                obtenerUsuario(jwt));
    }

    @GetMapping("/todas")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERADOR', 'ROLE_ADMINISTRADOR')")
    public ResponseEntity<Object> listarTodasLasSolicitudes() {

        return solicitudClienteServicio
                .listarTodasLasSolicitudes();
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERADOR', 'ROLE_ADMINISTRADOR')")
    public ResponseEntity<Object> actualizarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, Object> peticion) {

        return solicitudClienteServicio
                .actualizarEstado(id, peticion);
    }

    private String obtenerUsuario(Jwt jwt) {

        String usuario = jwt.getClaimAsString("preferred_username");

        if (usuario == null || usuario.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "El token no contiene el usuario.");
        }

        return usuario;
    }
}