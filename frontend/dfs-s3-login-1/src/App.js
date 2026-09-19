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

      try {
        const respuestaToken = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0]
        });

        // Reemplazo de respuesta
        const configuracion = {
          headers: {
            Authorization: `Bearer ${respuestaToken.accessToken}`
          }
        };

        const [respuestaUsuario, respuestaSolicitudes] = await Promise.all([
          Axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/v2/usuario`,
            configuracion
          ),
          Axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/v2/solicitudes/mias`,
            configuracion
          )
        ]);

        setUsuarioBackend(respuestaUsuario.data);
        setSolicitudes(respuestaSolicitudes.data);

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

  //
  const revisarSolicitud = () => {
    setErrorSolicitud("");
    setSolicitudRevisada(null); // con este setteo, limpiaremos la revisión anterior

    if (
      titulo.trim() === "" ||
      descripcion.trim() === "" ||
      prioridad === ""
    ) {
      setErrorSolicitud(
        "Los campos título, descripción y prioridad son obligatorios."
      );
      return;
    }

    setSolicitudRevisada({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      prioridad
    });
  };

  //Funcion asincrona para enviar la solicitud
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
      setPrioridad("");
    } catch (error) {
      console.error(error);
      setErrorSolicitud("No fue posible crear la solicitud.");
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
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
        {accounts.length > 0 && (
          <>
            <p>
              Nombre:
              {" "}
              {accounts[0].name}
            </p>

            <p>
              Usuario:
              {" "}
              {accounts[0].username}
            </p>

            {/*
            <p>
              id:
              {" "}
              {accounts[0].idTokenClaims.oid}
            </p>
            /
            

            <p>
              idTokenClaims:
              {" "}
              {JSON.stringify(accounts[0].idTokenClaims)}
            </p>
            */}
          </>
        )}


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

        {/*Recuerden que el mb es margin bottom , y mt es margin top (Margen de arriba o abajo) */}

        {/* ---------- TARJETA PARA NUEVA SOLICITUD ---------- */}
        <div className="card p-3 mb-3"> {/* Div para el recuadro de solicitud */}
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
              disabled
              aria-describedby="ayudaCategoria"
            >
              <option value="">Catálogo pendiente de conexión</option>
            </select>

            {/* form-text: texto de ayuda */}
            <div id="ayudaCategoria" className="form-text">
              Las categorías se cargarán desde el catálogo.
            </div>
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
            className="btn btn-primary"
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
              <p>Estado: {solicitudCreada.estado}</p>
            </div>
          )}

        </div>

          {/* ---------- TARJETA PARA VER MIS SOLICITUDES ---------- */}
        <div className="card p-3 mb-3">
          <h2>Mis solicitudes</h2>

          {solicitudes.length === 0 ? (
            <p>No tienes solicitudes registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
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
                      <td>{solicitud.prioridad}</td>
                      <td>{solicitud.estado}</td>
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

        <button onClick={cerrarSesion} className="btn btn-danger">
          Cerrar sesión
        </button>
      </AuthenticatedTemplate>

    </div>
  );
}

export default App;
