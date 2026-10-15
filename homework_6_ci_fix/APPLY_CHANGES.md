# Применение исправлений ДЗ 6

Этот архив содержит файлы проекта без дополнительной внешней папки.

1. Распаковать архив в отдельную пустую папку.
2. Скопировать всё её содержимое в рабочую КОПИЮ проекта для ДЗ 6,
   соглашаясь на замену совпадающих файлов. Копия пока может называться homework_5.
3. Существующие .env.local и node_modules сохранить: в архиве их нет.
   package.json и package-lock.json не менялись относительно присланного
   homework_5(1).zip; переустановка зависимостей не требуется.
4. В обычном терминале проекта выполнить:

```powershell
$env:ComSpec = "$env:SystemRoot\System32\cmd.exe"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:run
npm.cmd run build
```

При ошибке остановиться и сохранить вывод. Ожидается 31 тест.

.github/workflows/ci.yml в этой локальной копии — подготовленный файл.
При загрузке в общий репозиторий он должен попасть в корневую .github/workflows,
а остальные файлы приложения — в homework_6. .prettierrc, .prettierignore
и integration_documentation.md остаются внутри homework_6.

Фактический запуск GitHub Actions и deploy ещё не выполнены.
