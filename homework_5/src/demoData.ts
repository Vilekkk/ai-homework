import type { Task } from './types';

const now = Date.now();

export const demoTasks: Task[] = [
  {
    id: 'd1',
    title: 'Подготовить презентацию для клиента',
    description: 'Собрать слайды по итогам квартала, добавить графики продаж.',
    priority: 'high',
    completed: false,
    createdAt: now - 1000 * 60 * 60 * 3,
  },
  {
    id: 'd2',
    title: 'Ответить на письма от партнёров',
    description: 'Проверить входящие, ответить на три запроса от подрядчиков.',
    priority: 'medium',
    completed: false,
    createdAt: now - 1000 * 60 * 60 * 6,
  },
  {
    id: 'd3',
    title: 'Обновить дизайн главной страницы',
    description: 'Переработать герой-секцию согласно новому брендбуку.',
    priority: 'high',
    completed: false,
    createdAt: now - 1000 * 60 * 60 * 24,
  },
  {
    id: 'd4',
    title: 'Купить канцелярские принадлежности',
    description: '',
    priority: 'low',
    completed: true,
    createdAt: now - 1000 * 60 * 60 * 48,
  },
  {
    id: 'd5',
    title: 'Провести ревью кода нового модуля',
    description: 'Проверить PR от команды, оставить комментарии по архитектуре.',
    priority: 'medium',
    completed: true,
    createdAt: now - 1000 * 60 * 60 * 72,
  },
  {
    id: 'd6',
    title: 'Запланировать командную встречу',
    description: 'Назначить еженедельный синк на пятницу, 15:00.',
    priority: 'low',
    completed: false,
    createdAt: now - 1000 * 60 * 30,
  },
];
