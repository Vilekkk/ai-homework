import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from '@/App';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('App user flows', () => {
  it('combines status and priority filters and restores the list on reset', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Выполненные' }));
    fireEvent.click(screen.getByRole('button', { name: 'Высокий' }));
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(screen.queryByText('Ничего не найдено')).not.toBeInTheDocument();
    expect(screen.getAllByText('Подготовить презентацию для клиента').length).toBeGreaterThan(0);
  });

  it('creates a task through the form and restores it after remount', () => {
    const view = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText(/Название/), { target: { value: 'Проверка восстановления' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Добавить' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Задача добавлена');
    view.unmount();
    render(<App />);
    expect(screen.getAllByText('Проверка восстановления').length).toBeGreaterThan(0);
  });

  it('explains a storage failure in the interface', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('до закрытия страницы');
  });
});
