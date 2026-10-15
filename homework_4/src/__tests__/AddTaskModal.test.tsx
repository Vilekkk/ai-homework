import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddTaskModal from '@/components/AddTaskModal';

function setup() {
  const onAdd = vi.fn(), onClose = vi.fn();
  render(<AddTaskModal open onAdd={onAdd} onClose={onClose} />);
  return { onAdd, onClose };
}

describe('AddTaskModal - validation and keyboard', () => {
  it('adds a valid trimmed task with medium priority', () => {
    const { onAdd, onClose } = setup();
    fireEvent.change(screen.getByLabelText(/Название/), { target: { value: '  Учебная задача  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(onAdd).toHaveBeenCalledWith('Учебная задача', '', 'medium');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each(['   ', 'a'.repeat(201)])('keeps the form open for invalid title of length %s', (title) => {
    const { onAdd, onClose } = setup();
    fireEvent.change(screen.getByLabelText(/Название/), { target: { value: title } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('preserves input and shows an error for an oversized description', () => {
    const { onAdd, onClose } = setup();
    fireEvent.change(screen.getByLabelText(/Название/), { target: { value: 'Задача' } });
    fireEvent.change(screen.getByLabelText('Описание'), { target: { value: 'a'.repeat(2001) } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('2000');
    expect(screen.getByLabelText(/Название/)).toHaveValue('Задача');
    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes with Escape without creating a task', () => {
    const { onAdd, onClose } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
