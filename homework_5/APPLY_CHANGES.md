# Применение исправленной версии

1. Сделать копию своей рабочей папки homework_5.
2. Скопировать содержимое homework_5 из этого архива в рабочую папку
   homework_5, соглашаясь на замену совпадающих файлов.
3. Свои .env.local и node_modules сохранить. В этом архиве их нет.
   package.json и package-lock.json не менялись, переустановка не требуется.
4. В новом терминале выполнить:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit -p tsconfig.app.json
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\vite\bin\vite.js build
```

Ожидается 31 тест. Затем перезапустить dev-сервер, войти и проверить
сохранённую задачу. Миграцию заново не выполнять.


