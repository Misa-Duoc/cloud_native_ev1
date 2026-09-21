package cl.duoc.api_cloud_native.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/catalogo/prioridades")
public class PrioridadBffControlador {

    @Value("${CATALOGO_URL:http://10.0.0.214:8082}")
    private String catalogoUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // GET: Cliente, Operador y Administrador
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENTE', 'ROLE_OPERADOR', 'ROLE_ADMINISTRADOR')")
    public ResponseEntity<?> listar() {
        String url = catalogoUrl + "/api/catalogo/prioridades";
        return restTemplate.getForEntity(url, Object.class);
    }

    // POST: Solo Administrador
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<?> crear(@RequestBody Object body) {
        String url = catalogoUrl + "/api/catalogo/prioridades";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForEntity(url, entity, Object.class);
    }

    // PUT: Solo Administrador
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Object body) {
        String url = catalogoUrl + "/api/catalogo/prioridades/" + id;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(url, HttpMethod.PUT, entity, Object.class);
    }

    // DELETE: Solo Administrador
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        String url = catalogoUrl + "/api/catalogo/prioridades/" + id;
        return restTemplate.exchange(url, HttpMethod.DELETE, null, Object.class);
    }
}