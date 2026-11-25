import { Platform } from 'react-native';

// Identidad visual de FisioKids (según el diseño de Figma)
export const colores = {
  azul: '#2B7DE9',
  turquesa: '#19A7B0',
  menta: '#5EE0C8',
  marino: '#0F2A43',
  marinoOscuro: '#0F3550',
  fondo: '#F3F7FB',
  tarjeta: '#FFFFFF',
  borde: '#E5ECF4',
  texto: '#0F2A43',
  textoSuave: '#6B7C93',
  // tintes suaves para íconos y estados
  azulClaro: '#E6F0FD',
  verdeClaro: '#DDF5EA',
  moradoClaro: '#EEE7FB',
  naranjaClaro: '#FDEFD9',
  rojoClaro: '#FDE8E8',
  exito: '#1E9E6A',
  alerta: '#E8890C',
  error: '#E5484D',
  morado: '#7C5CD6',
  // nombres usados por pantallas anteriores
  primario: '#2B7DE9',
  primarioOscuro: '#0F2A43',
  acento: '#19A7B0',
};

export const degradadoBoton = ['#2B7DE9', '#19A7B0'];
export const degradadoTarjeta = ['#0F3550', '#1B7F8C'];
export const degradadoSplash = ['#0F2F4A', '#17808A'];

export const sombra = Platform.select({
  ios: { shadowColor: '#0F2A43', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 2 },
  default: {},
});

export const tarjeta = {
  backgroundColor: colores.tarjeta,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colores.borde,
  ...sombra,
};
