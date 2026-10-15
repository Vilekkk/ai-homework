import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskFilters from "@/components/TaskFilters";

describe("TaskFilters", () => {
  // Тест 10: рендер всех фильтров
  it("should render all filter options", () => {
    const onStatusChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onReset = vi.fn();

    render(
      <TaskFilters
        statusFilter="all"
        priorityFilter="all"
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onReset={onReset}
        hasActiveFilters={false}
      />
    );

    expect(screen.getByText("Активные")).toBeInTheDocument();
    expect(screen.getByText("Выполненные")).toBeInTheDocument();
    expect(screen.getByText("Высокий")).toBeInTheDocument();
    expect(screen.getByText("Средний")).toBeInTheDocument();
    expect(screen.getByText("Низкий")).toBeInTheDocument();
    // "Все" есть в обоих фильтрах, проверяем наличие хотя бы одного
    expect(screen.getAllByText("Все").length).toBe(2);
  });

  // Тест 11: переключение статуса
  it("should call onStatusChange when status filter is clicked", () => {
    const onStatusChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onReset = vi.fn();

    render(
      <TaskFilters
        statusFilter="all"
        priorityFilter="all"
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onReset={onReset}
        hasActiveFilters={false}
      />
    );

    fireEvent.click(screen.getByText("Активные"));
    expect(onStatusChange).toHaveBeenCalledWith("active");
  });

  // Тест 12: сброс фильтров
  it("should call onReset when reset button is clicked", () => {
    const onStatusChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onReset = vi.fn();

    render(
      <TaskFilters
        statusFilter="active"
        priorityFilter="high"
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onReset={onReset}
        hasActiveFilters={true}
      />
    );

    fireEvent.click(screen.getByText("Сбросить"));
    expect(onReset).toHaveBeenCalled();
  });

  // Тест 13: кнопка сброса скрыта когда фильтры не активны
  it("should hide reset button when no filters active", () => {
    const onStatusChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onReset = vi.fn();

    render(
      <TaskFilters
        statusFilter="all"
        priorityFilter="all"
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onReset={onReset}
        hasActiveFilters={false}
      />
    );

    expect(screen.queryByText("Сбросить")).not.toBeInTheDocument();
  });
});
