import React from 'react';

import { Tag } from './Tag.jsx';
const STATUS = {
  'Colonizando': 'outline', 'Incubando': 'outline', 'En desarrollo': 'outline',
  'Colonizado': 'accent', 'Listo': 'accent', 'Fructificando': 'accent', 'En curso': 'accent', 'Activa': 'accent',
  'Usado': 'neutral', 'Finalizado': 'neutral', 'Finalizada': 'neutral', 'Cosechado': 'neutral', 'Descartado': 'neutral',
  'Contaminado': 'danger',
};
export function StatusTag({ status, children, ...rest }) {
  return <Tag tone={STATUS[status] || 'neutral'} strike={status === 'Descartado'} {...rest}>{children || status}</Tag>;
}
