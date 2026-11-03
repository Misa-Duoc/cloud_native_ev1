package cl.duoc.mesatech.solicitudes.repository;

import cl.duoc.mesatech.solicitudes.model.CopiaCategoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CopiaCategoriaRepositorio extends JpaRepository<CopiaCategoria, Long> {
}