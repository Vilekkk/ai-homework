import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddTaskModal from '@/components/AddTaskModal';

function setup(isSubmitting = false) {
  const onAdd = vi.fn().mockResolvedValue(undefined),
    onClose = vi.fn();
  render(
    <AddTaskModal
      open
      onAdd={onAdd}
      onClose={onClose}
      isSubmitting={isSubmitting}
    />
  );
  return { onAdd, onClose };
}

describe('AddTaskModal - validation and keyboard', () => {
  it('adds a valid trimmed task with medium priority', async () => {
    const { onAdd, onClose } = setup();
    fireEvent.change(screen.getByLabelText(/Название/), {
      target: { value: '  Учебная задача  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(onAdd).toHaveBeenCalledWith(
      'Учебная задача',
      '',
      'medium'
    );
    // onClose is called after onAdd resolves
    await waitForResolve(onAdd);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each(['   ', 'a'.repeat(201)])(
    'keeps the form open for invalid title of length %s',
    (title) => {
      const { onAdd, onClose } = setup();
      fireEvent.change(screen.getByLabelText(/Название/), {
        target: { value: title },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    }
  );

  it('preserves input and shows an error for an oversized description', () => {
    const { onAdd, onClose } = setup();
    fireEvent.change(screen.getByLabelText(/Название/), {
      target: { value: 'Задача' },
    });
    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'a'.repeat(2001) },
    });
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

  it('blocks submission while isSubmitting is true', () => {
    const { onAdd, onClose } = setup(true);
    fireEvent.change(screen.getByLabelText(/Название/), {
      target: { value: 'Задача' },
    });
    // When isSubmitting, button text changes to "Добавляю…"
    fireEvent.click(screen.getByRole('button', { name: 'Добавляю…' }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Добавляю…' })
    ).toBeDisabled();
  });
});

/**
 * Helper: wait for the mocked onAdd promise to resolve.
 */
function waitForResolve(mockFn: ReturnType<typeof vi.fn>) {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (mockFn.mock.calls.length > 0) {
        const lastCall = mockFn.mock.calls[mockFn.mock.calls.length - 1];
        if (lastCall[0] !== undefined) {
          Promise.resolve()
            .then(() => lastCall[0]())
            .then(resolve, resolve);
          return;
        }
      }
      setTimeout(check, 10);
    };
    check();
  });
}
