import './App.css';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest, apiRequest } from './authConfig';
import { useEffect, useState } from 'react';
import Axios from 'axios';


function App() {

  // Estados de la consulta backend
  const { instance, accounts } = useMsal();
  const [usuarioBackend, setUsuarioBackend] = useState(null);
  const [errorBackend, setErrorBackend] = useState(null);
  // Agregado
  const [cargando, setCargando] = useState(false);

  //Estados del formulario
  // Agregado
  const [titulo, setTitulo] = useState("");
  // Agregado
  const [descripcion, setDescripcion] = useState("");
  // Agregado
  const [prioridad, setPrioridad] = useState("");
  // Agregado
  const [errorSolicitud, setErrorSolicitud] = useState("");
  // Agregado , mostraremos el resumen en la pagina
  const [solicitudRevisada, setSolicitudRevisada] = useState(null);

  // Agregados funcionales con la api
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [solicitudCreada, setSolicitudCreada] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);

  // Estados del catálogo
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [errorCatalogo, setErrorCatalogo] = useState("");

  // Estados para administrar el catalogo
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [descripcionCategoria, setDescripcionCategoria] = useState("");
  const [categoriaEditandoId, setCategoriaEditandoId] = useState(null);
  const [procesandoCategoria, setProcesandoCategoria] = useState(false);
  const [mensajeCatalogo, setMensajeCatalogo] = useState("");

  // Agregados para actualizar mediante patch
  const [solicitudActualizandoId, setSolicitudActualizandoId] = useState(null);
  const [mensajeEstado, setMensajeEstado] = useState("");
  const [errorEstado, setErrorEstado] = useState("");

  const esGestorSolicitudes =
    usuarioBackend?.roles?.includes("ROLE_OPERADOR") ||
    usuarioBackend?.roles?.includes("ROLE_ADMINISTRADOR");

  const esCliente =
    usuarioBackend?.roles?.includes("ROLE_CLIENTE");

  const esAdministrador =
    usuarioBackend?.roles?.includes("ROLE_ADMINISTRADOR");

  const obtenerEstadosPermitidos = (estadoActual) => {
    switch (estadoActual) {
      case "CREADA":
        return ["ASIGNADA", "CANCELADA"];

      case "ASIGNADA":
        return ["EN_PROCESO", "CANCELADA"];

      case "EN_PROCESO":
        return ["RESUELTA", "CANCELADA"];

      case "RESUELTA":
        return ["CERRADA"];

      case "CERRADA":
      case "CANCELADA":
        return [];

      default:
        return [];
    }
  };

  const mostrarEstado = (estado) => {
    switch (estado) {
      case "CREADA":
        return "Creada";

      case "ASIGNADA":
        return "Asignada";

      case "EN_PROCESO":
        return "En proceso";

      case "RESUELTA":
        return "Resuelta";

      case "CERRADA":
        return "Cerrada";

      case "CANCELADA":
        return "Cancelada";

      default:
        return estado;
    }
  };


  const iniciarSesion = () => {
    instance.loginRedirect(loginRequest)
      .catch(error => {
        console.error(error);
      });
  }

  const cerrarSesion = () => {
    instance.logoutRedirect();
  }

  useEffect(() => {
    if (accounts.length === 0) {
      return;
    }


    const obtenerUsuarioBackend = async () => {
      setCargando(true);
      setErrorBackend(null);
      setUsuarioBackend(null);
      setErrorCatalogo("");

      try {
        const respuestaToken = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0]
        });

        const configuracion = {
          headers: {
            Authorization: `Bearer ${respuestaToken.accessToken}`
          }
        };

        const respuestaUsuario = await Axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/v2/usuario`,
          configuracion
        );

        const rolesUsuario = respuestaUsuario.data.roles || [];

        const puedeGestionarSolicitudes =
          rolesUsuario.includes("ROLE_OPERADOR") ||
          rolesUsuario.includes("ROLE_ADMINISTRADOR");

        const rutaSolicitudes = puedeGestionarSolicitudes
          ? "/v2/solicitudes"
          : "/v2/solicitudes/mias";

        const respuestaSolicitudes = await Axios.get(
          `${process.env.REACT_APP_API_BASE_URL}${rutaSolicitudes}`,
          configuracion
        );

        setUsuarioBackend(respuestaUsuario.data);
        setSolicitudes(respuestaSolicitudes.data);
        try {
          const respuestaCatalogo = await Axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/v2/catalogo`,
            configuracion
          );

          setCategorias(respuestaCatalogo.data);
        } catch (errorCatalogoRespuesta) {
          console.error(errorCatalogoRespuesta);
          setCategorias([]);
          setErrorCatalogo(
            "No fue posible cargar las categorías."
          );
        }

      } catch (error) {
        console.error(error);
        setErrorBackend(
          "No fue posible consultar tus datos. Inténtalo nuevamente."
        );
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuarioBackend();
  }, [accounts, instance]);

  //  ----------------- Funcion para REVISAR la solicitud -----------------
  const revisarSolicitud = () => {
    setErrorSolicitud("");
    setSolicitudRevisada(null);

    if (
      titulo.trim() === "" ||
      descripcion.trim() === "" ||
      categoriaId === "" ||
      prioridad === ""
    ) {
      setErrorSolicitud(
        "Los campos título, descripción, categoría y prioridad son obligatorios."
      );
      return;
    }

    const categoriaSeleccionada = categorias.find(
      (categoria) => String(categoria.id) === categoriaId
    );

    if (!categoriaSeleccionada) {
      setErrorSolicitud(
        "La categoría seleccionada no es válida."
      );
      return;
    }

    setSolicitudRevisada({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoriaId: Number(categoriaId),
      categoriaNombre: categoriaSeleccionada.nombre,
      prioridad
    });
  };

  //  ----------------- Funcion asincrona para ENVIAR la solicitud -----------------
  const enviarSolicitud = async () => {
    if (!solicitudRevisada || accounts.length === 0) {
      return;
    }

    setEnviandoSolicitud(true);
    setErrorSolicitud("");

    try {
      const respuestaToken = await instance.acquireTokenSilent({
        ...apiRequest,
        account: accounts[0]
      });

      const respuesta = await Axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/v2/solicitudes`,
        solicitudRevisada,
        {
          headers: {
            Authorization: `Bearer ${respuestaToken.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      setSolicitudCreada(respuesta.data);
      setSolicitudes((solicitudesAnteriores) => [
        respuesta.data,
        ...solicitudesAnteriores
      ]);
      setSolicitudRevisada(null);
      setTitulo("");
      setDescripcion("");
      setCategoriaId("");
      setPrioridad("");
    } catch (error) {
      console.error(error);
      setErrorSolicitud("No fue posible crear la solicitud.");
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  //  ----------------- Funcion asincrona para ACTUALIZAR estado -----------------
  const actualizarEstado = async (id, nuevoEstado) => {
    if (accounts.length === 0) {
      return;
    }

    setSolicitudActualizandoId(id);
    setMensajeEstado("");
    setErrorEstado("");

    try {
      const respuestaToken = await instance.acquireTokenSilent({
        ...apiRequest,
        account: accounts[0]
      });

      const respuesta = await Axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/v2/solicitudes/${id}/estado`,
        {
          estado: nuevoEstado
        },
        {
          headers: {
            Authorization: `Bearer ${respuestaToken.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      setSolicitudes((solicitudesAnteriores) =>
        solicitudesAnteriores.map((solicitud) =>
          solicitud.id === id ? respuesta.data : solicitud
        )
      );

      setMensajeEstado(
        `Estado de la solicitud ${id} actualizado correctamente.`
      );
    } catch (error) {
      console.error(error);

      const mensajeError =
        error.response?.data?.mensaje ||
        `No fue posible actualizar la solicitud ${id}.`;

      setErrorEstado(mensajeError);
    } finally {
      setSolicitudActualizandoId(null);
    }
  };

  //  ----------------- Funcion asincrona de configuración autorizada para el catálogo -----------------
  const obtenerConfiguracionAutorizada = async () => {
    const respuestaToken = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0]
    });

    return {
      headers: {
        Authorization: `Bearer ${respuestaToken.accessToken}`,
        "Content-Type": "application/json"
      }
    };
  };

  //  ----------------- Funcion asincrona de crear o actualizar una categoría -----------------
  const guardarCategoria = async () => {
    if (accounts.length === 0) {
      return;
    }

    if (
      nombreCategoria.trim() === "" ||
      descripcionCategoria.trim() === ""
    ) {
      setErrorCatalogo(
        "El nombre y la descripción de la categoría son obligatorios."
      );
      return;
    }

    setProcesandoCategoria(true);
    setMensajeCatalogo("");
    setErrorCatalogo("");

    try {
      const configuracion =
        await obtenerConfiguracionAutorizada();

      const peticion = {
        nombre: nombreCategoria.trim(),
        descripcion: descripcionCategoria.trim()
      };

      if (categoriaEditandoId === null) {
        const respuesta = await Axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/v2/catalogo`,
          peticion,
          configuracion
        );

        setCategorias((categoriasAnteriores) => [
          ...categoriasAnteriores,
          respuesta.data
        ]);

        setMensajeCatalogo(
          "Categoría creada correctamente."
        );
      } else {
        const respuesta = await Axios.put(
          `${process.env.REACT_APP_API_BASE_URL}/v2/catalogo/${categoriaEditandoId}`,
          peticion,
          configuracion
        );

        setCategorias((categoriasAnteriores) =>
          categoriasAnteriores.map((categoria) =>
            categoria.id === categoriaEditandoId
              ? respuesta.data
              : categoria
          )
        );

        setMensajeCatalogo(
          "Categoría actualizada correctamente."
        );
      }

      setNombreCategoria("");
      setDescripcionCategoria("");
      setCategoriaEditandoId(null);
    } catch (error) {
      console.error(error);
      setErrorCatalogo(
        "No fue posible guardar la categoría."
      );
    } finally {
      setProcesandoCategoria(false);
    }
  };

  //  ----------------- Funcion que Coloca una categoría existente dentro del formulario -----------------
  const prepararEdicionCategoria = (categoria) => {
    setCategoriaEditandoId(categoria.id);
    setNombreCategoria(categoria.nombre);
    setDescripcionCategoria(categoria.descripcion);
    setMensajeCatalogo("");
    setErrorCatalogo("");
  };

  //  ----------------- Funcion que cancela la edición y vacía el formulario -----------------
  const cancelarEdicionCategoria = () => {
    setCategoriaEditandoId(null);
    setNombreCategoria("");
    setDescripcionCategoria("");
    setMensajeCatalogo("");
    setErrorCatalogo("");
  };

  //  ----------------- Funcion que Elimina una categoría -----------------
  const eliminarCategoria = async (categoria) => {
    const confirmacion = window.confirm(
      `¿Deseas eliminar la categoría ${categoria.nombre}?`
    );

    if (!confirmacion || accounts.length === 0) {
      return;
    }

    setProcesandoCategoria(true);
    setMensajeCatalogo("");
    setErrorCatalogo("");

    try {
      const configuracion =
        await obtenerConfiguracionAutorizada();

      await Axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/v2/catalogo/${categoria.id}`,
        configuracion
      );

      setCategorias((categoriasAnteriores) =>
        categoriasAnteriores.filter(
          (categoriaActual) =>
            categoriaActual.id !== categoria.id
        )
      );

      if (categoriaEditandoId === categoria.id) {
        setCategoriaEditandoId(null);
        setNombreCategoria("");
        setDescripcionCategoria("");
      }

      setMensajeCatalogo(
        "Categoría eliminada correctamente."
      );
    } catch (error) {
      console.error(error);
      setErrorCatalogo(
        "No fue posible eliminar la categoría."
      );
    } finally {
      setProcesandoCategoria(false);
    }
  };

  //  ----------------- Funcion para LIMPIAR el formulario -----------------
  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
    setCategoriaId("");
    setPrioridad("");
    setErrorSolicitud("");
    setSolicitudRevisada(null);
  };

  return (
    <div className="container" style={{ padding: "30px" }}>
      <h1>Login con Microsoft Entra ID</h1>
      <UnauthenticatedTemplate>
        <p className="alert alert-danger mt-3">
          El usuario no está autenticado.
        </p>
        <button onClick={iniciarSesion} className="btn btn-primary">
          Iniciar sesión
        </button>
      </UnauthenticatedTemplate>


      <AuthenticatedTemplate>

        {cargando && (
          <p className="alert alert-info">
            Consultando backend…
          </p>
        )}

        <h2>Usuario autenticado</h2>

        {usuarioBackend && (
          <div className="alert alert-success">
            <h2>Respuesta del backend</h2>
            <p>{usuarioBackend.mensaje}</p>
            <p>Nombre: {usuarioBackend.nombre}</p>
            <p>Usuario: {usuarioBackend.usuario}</p>
            <p>Roles: {usuarioBackend.roles?.join(", ") || "Sin rol asignado"}</p> {/* ? ejecuta joins solo si existen roles*/}
          </div>
        )}

        {errorBackend && (
          <div className="alert alert-danger">
            {errorBackend}
          </div>
        )}

        {/* ---------- TARJETA ADMINISTRACIÓN DEL CATÁLOGO ---------- */}
        {esAdministrador && (
          <div className="card p-3 mb-3">
            <h2>Administración del catálogo</h2>

            {mensajeCatalogo && (
              <div className="alert alert-success">
                {mensajeCatalogo}
              </div>
            )}

            {errorCatalogo && (
              <div className="alert alert-danger">
                {errorCatalogo}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="nombreCategoria" className="form-label">
                Nombre
              </label>

              <input
                id="nombreCategoria"
                type="text"
                className="form-control"
                value={nombreCategoria}
                onChange={(evento) =>
                  setNombreCategoria(evento.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="descripcionCategoria" className="form-label">
                Descripción
              </label>

              <textarea
                id="descripcionCategoria"
                className="form-control"
                rows={3}
                value={descripcionCategoria}
                onChange={(evento) =>
                  setDescripcionCategoria(evento.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <button
                type="button"
                className="btn btn-primary me-2"
                onClick={guardarCategoria}
                disabled={procesandoCategoria}
              >
                {procesandoCategoria
                  ? "Guardando..."
                  : categoriaEditandoId === null
                    ? "Crear categoría"
                    : "Guardar cambios"}
              </button>

              {categoriaEditandoId !== null && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelarEdicionCategoria}
                  disabled={procesandoCategoria}
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <h3>Categorías registradas</h3>

            {categorias.length === 0 ? (
              <p>No hay categorías registradas.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categorias.map((categoria) => (
                      <tr key={categoria.id}>
                        <td>{categoria.id}</td>
                        <td>{categoria.nombre}</td>
                        <td>{categoria.descripcion}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-warning btn-sm me-2"
                            onClick={() =>
                              prepararEdicionCategoria(categoria)
                            }
                            disabled={procesandoCategoria}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              eliminarCategoria(categoria)
                            }
                            disabled={procesandoCategoria}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/*  ----------------- TARJETA PARA NUEVA SOLICITUD  ----------------- */}
        {/*Recuerden que el mb es margin bottom , y mt es margin top (Margen de arriba o abajo) */}
        <div className="card p-3 mb-3"
          style={{ display: esCliente ? "block" : "none" }}> {/* Div para el recuadro de solicitud */}

          <h2>Nueva solicitud</h2>

          <div className="mb-3">  {/* Titulo */}
            <label htmlFor="titulo" className="form-label"> {/* El form label es solo el estilo */}
              Título
            </label>
            <input
              id="titulo"
              type="text"
              className="form-control"
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
            />
          </div>

          <div className="mb-3"> {/* Descripción */}
            <label htmlFor="descripcion" className="form-label">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className="form-control"
              rows={3}
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
            />
          </div>

          <div className="mb-3"> {/* Categoria */}
            {/* form-label: estilo de etiqueta */}
            <label htmlFor="categoria" className="form-label">
              Categoría
            </label>

            {/* form-select: estilo del selector */}
            <select
              id="categoria"
              className="form-select"
              value={categoriaId}
              onChange={(evento) => setCategoriaId(evento.target.value)}
              disabled={categorias.length === 0}
              aria-describedby="ayudaCategoria"
            >
              <option value="">Selecciona una categoría</option>

              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>

            <div id="ayudaCategoria" className="form-text">
              {categorias.length === 0
                ? "No hay categorías disponibles."
                : "Selecciona la categoría de la solicitud."}
            </div>

            {errorCatalogo && (
              <div className="text-danger mt-1">
                {errorCatalogo}
              </div>
            )}
          </div>

          <div className="mb-3">  {/* Prioridad */}
            <label htmlFor="prioridad" className="form-label">
              Prioridad
            </label>

            {/* form-select: estilo del selector */}
            <select
              id="prioridad"
              className="form-select"
              value={prioridad}
              onChange={(evento) => setPrioridad(evento.target.value)}
            >
              <option value="">Selecciona una prioridad</option>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>

          {/* alert: recuadro de aviso; alert-danger: color de error */}
          {errorSolicitud && (
            <div className="alert alert-danger" role="alert">
              {errorSolicitud}
            </div>
          )}

          {/* btn: estilo de botón, btn-primary: color principal (Los colores estan en bootstrap) */}
          <button
            type="button"
            className="btn btn-primary mt-3 me-2"
            onClick={revisarSolicitud}
          >
            Revisar solicitud
          </button>

          {/* btn: estilo de botón; btn-secondary: color secundario */}
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={limpiarFormulario}
          >
            Limpiar formulario
          </button>

          {/* alert: recuadro de aviso, alert-info: color informativo, mt-3: margen superior*/}
          {solicitudRevisada && (
            <div className="alert alert-info mt-3">
              <h3>Resumen de la solicitud</h3>
              <p>Título: {solicitudRevisada.titulo}</p>
              <p>Descripción: {solicitudRevisada.descripcion}</p>
              <p>Categoría: {solicitudRevisada.categoriaNombre}</p>
              <p>Prioridad: {solicitudRevisada.prioridad}</p>
              <p>Vista previa. La solicitud todavía no se ha enviado.</p>
              <button
                type="button"
                className="btn btn-success"
                onClick={enviarSolicitud}
                disabled={enviandoSolicitud}
              >
                {enviandoSolicitud ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          )}
          {solicitudCreada && (
            <div className="alert alert-success mt-3">
              <h3>Solicitud creada correctamente</h3>
              <p>ID: {solicitudCreada.id}</p>
              <p>Título: {solicitudCreada.titulo}</p>
              <p>Categoría: {solicitudCreada.categoriaNombre}</p>
              <p>Estado: {mostrarEstado(solicitudCreada.estado)}</p>
            </div>
          )}

        </div>

        {/*  ----------------- TARJETA PARA VER MIS SOLICITUDES  ----------------- */}
        <div className="card p-3 mb-3">
          <h2>
            {esGestorSolicitudes
              ? "Gestión de solicitudes"
              : "Mis solicitudes"}
          </h2>

          {mensajeEstado && (
            <div className="alert alert-success">
              {mensajeEstado}
            </div>
          )}

          {errorEstado && (
            <div className="alert alert-danger">
              {errorEstado}
            </div>
          )}

          {solicitudes.length === 0 ? (
            <p>No tienes solicitudes registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Categoría</th>
                    {esGestorSolicitudes && <th>Usuario</th>}
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>{solicitud.id}</td>
                      <td>{solicitud.titulo}</td>
                      <td>{solicitud.categoriaNombre || "Sin categoría"}</td>
                      {esGestorSolicitudes && (
                        <td>{solicitud.usuario}</td>
                      )}
                      <td>{solicitud.prioridad}</td>
                      <td>
                        {esGestorSolicitudes ? (
                          <select
                            className="form-select"
                            value={solicitud.estado}
                            onChange={(evento) =>
                              actualizarEstado(
                                solicitud.id,
                                evento.target.value
                              )
                            }
                            disabled={
                              solicitudActualizandoId === solicitud.id ||
                              obtenerEstadosPermitidos(
                                solicitud.estado
                              ).length === 0
                            }
                          >
                            <option value={solicitud.estado}>
                              {mostrarEstado(solicitud.estado)}
                            </option>

                            {obtenerEstadosPermitidos(
                              solicitud.estado
                            ).map((estadoPermitido) => (
                              <option
                                key={estadoPermitido}
                                value={estadoPermitido}
                              >
                                {mostrarEstado(estadoPermitido)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          mostrarEstado(solicitud.estado)
                        )}
                      </td>
                      <td>
                        {solicitud.fechaCreacion?.replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* ----------------- BOTÓN PARA CERRAR LA SESIÓN  ----------------- */}
        <button onClick={cerrarSesion} className="btn btn-danger">
          Cerrar sesión
        </button>
      </AuthenticatedTemplate>

    </div>
  );
}

export default App;
