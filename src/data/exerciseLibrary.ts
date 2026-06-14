import { LibraryExercise } from '@/types';

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Pecho
  { id: 'chest_1', name: 'Press de Banca', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: 'chest_2', name: 'Press de Banca Inclinado', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: 'chest_3', name: 'Press de Banca Declinado', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: 'chest_4', name: 'Press con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { id: 'chest_5', name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { id: 'chest_6', name: 'Fondos en Paralelas', muscleGroup: 'Pecho', equipment: 'Peso corporal' },
  { id: 'chest_7', name: 'Flexiones', muscleGroup: 'Pecho', equipment: 'Peso corporal' },
  { id: 'chest_8', name: 'Cable Crossover', muscleGroup: 'Pecho', equipment: 'Cable' },

  // Espalda
  { id: 'back_1', name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Peso corporal' },
  { id: 'back_2', name: 'Remo con Barra', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: 'back_3', name: 'Remo con Mancuerna', muscleGroup: 'Espalda', equipment: 'Mancuernas' },
  { id: 'back_4', name: 'Jalón al Pecho', muscleGroup: 'Espalda', equipment: 'Cable' },
  { id: 'back_5', name: 'Remo en Cable', muscleGroup: 'Espalda', equipment: 'Cable' },
  { id: 'back_6', name: 'Peso Muerto', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: 'back_7', name: 'Hiperextensiones', muscleGroup: 'Espalda', equipment: 'Banco' },

  // Hombros
  { id: 'shoulder_1', name: 'Press Militar', muscleGroup: 'Hombros', equipment: 'Barra' },
  { id: 'shoulder_2', name: 'Press de Hombros con Mancuernas', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
  { id: 'shoulder_3', name: 'Elevaciones Laterales', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
  { id: 'shoulder_4', name: 'Elevaciones Frontales', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
  { id: 'shoulder_5', name: 'Pájaros', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
  { id: 'shoulder_6', name: 'Face Pull', muscleGroup: 'Hombros', equipment: 'Cable' },

  // Bíceps
  { id: 'bicep_1', name: 'Curl con Barra', muscleGroup: 'Bíceps', equipment: 'Barra' },
  { id: 'bicep_2', name: 'Curl con Mancuernas', muscleGroup: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'bicep_3', name: 'Curl Martillo', muscleGroup: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'bicep_4', name: 'Curl en Cable', muscleGroup: 'Bíceps', equipment: 'Cable' },
  { id: 'bicep_5', name: 'Curl en Banco Scott', muscleGroup: 'Bíceps', equipment: 'Barra' },

  // Tríceps
  { id: 'tricep_1', name: 'Press Francés', muscleGroup: 'Tríceps', equipment: 'Barra' },
  { id: 'tricep_2', name: 'Extensión en Polea', muscleGroup: 'Tríceps', equipment: 'Cable' },
  { id: 'tricep_3', name: 'Fondos en Banco', muscleGroup: 'Tríceps', equipment: 'Peso corporal' },
  { id: 'tricep_4', name: 'Patada de Tríceps', muscleGroup: 'Tríceps', equipment: 'Mancuernas' },
  { id: 'tricep_5', name: 'Press Cerrado', muscleGroup: 'Tríceps', equipment: 'Barra' },

  // Piernas
  { id: 'leg_1', name: 'Sentadilla', muscleGroup: 'Piernas', equipment: 'Barra' },
  { id: 'leg_2', name: 'Prensa de Piernas', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { id: 'leg_3', name: 'Zancadas', muscleGroup: 'Piernas', equipment: 'Mancuernas' },
  { id: 'leg_4', name: 'Extensión de Cuádriceps', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { id: 'leg_5', name: 'Curl de Femoral', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { id: 'leg_6', name: 'Hip Thrust', muscleGroup: 'Piernas', equipment: 'Barra' },
  { id: 'leg_7', name: 'Peso Muerto Rumano', muscleGroup: 'Piernas', equipment: 'Barra' },
  { id: 'leg_8', name: 'Elevación de Gemelos de Pie', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { id: 'leg_9', name: 'Sentadilla Búlgara', muscleGroup: 'Piernas', equipment: 'Mancuernas' },

  // Abdominales
  { id: 'core_1', name: 'Crunch', muscleGroup: 'Abdominales', equipment: 'Peso corporal' },
  { id: 'core_2', name: 'Plancha', muscleGroup: 'Abdominales', equipment: 'Peso corporal' },
  { id: 'core_3', name: 'Elevación de Piernas', muscleGroup: 'Abdominales', equipment: 'Peso corporal' },
  { id: 'core_4', name: 'Crunch en Cable', muscleGroup: 'Abdominales', equipment: 'Cable' },
  { id: 'core_5', name: 'Rueda Abdominal', muscleGroup: 'Abdominales', equipment: 'Rueda' },
];

export const MUSCLE_GROUPS = [
  ...new Set(EXERCISE_LIBRARY.map((e) => e.muscleGroup)),
];
