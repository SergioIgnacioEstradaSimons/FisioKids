import { createContext, useContext } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';

// Guarda el usuario que inició sesión para que cualquier pantalla lo lea.
export const SesionContext = createContext({ usuario: null, setUsuario: () => {} });
export const useSesion = () => useContext(SesionContext);

// Referencia al navegador raíz: permite volver al Login desde cualquier pantalla (cerrar sesión)
export const navRef = createNavigationContainerRef();
export function irALogin() {
  if (navRef.isReady()) navRef.reset({ index: 0, routes: [{ name: 'Login' }] });
}
