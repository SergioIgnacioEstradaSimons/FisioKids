import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Texto from './Texto';
import { colores } from '../tema';

// Anillo de progreso (por ejemplo, el 75 % de asistencia)
export default function Anillo({ porcentaje, tam = 64, grosor = 7 }) {
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: tam, height: tam, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tam} height={tam} style={{ position: 'absolute' }}>
        <Circle cx={tam / 2} cy={tam / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={grosor} fill="none" />
        <Circle cx={tam / 2} cy={tam / 2} r={r} stroke={colores.menta} strokeWidth={grosor} fill="none"
          strokeLinecap="round" strokeDasharray={`${(c * porcentaje) / 100} ${c}`}
          transform={`rotate(-90 ${tam / 2} ${tam / 2})`} />
      </Svg>
      <Texto style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{porcentaje}%</Texto>
    </View>
  );
}
