AURA AI v2 — подключение настоящего ИИ через Gemini API и Cloudflare Pages

Что добавлено:
- настоящий запрос к Gemini через серверную функцию /api/chat;
- API-ключ хранится только как секрет Cloudflare, не в браузере;
- контекст последних сообщений;
- понятные сообщения об ошибках и лимитах;
- голосовой ввод/озвучивание из предыдущей версии.

ШАГ 1. Создай бесплатный ключ Gemini
1. Открой https://aistudio.google.com/apikey
2. Войди в Google-аккаунт.
3. Создай API key и скопируй его.
4. Не отправляй ключ в чат, не вставляй его в app.js и не публикуй в GitHub.
5. У бесплатного тарифа есть ограничения по моделям и запросам. Проверь актуальные лимиты в Google AI Studio.

ШАГ 2. Размести проект в GitHub
1. Создай новый пустой репозиторий на https://github.com
2. Распакуй архив AURA_AI_v2.
3. Загрузи ВСЕ файлы и папку functions в корень репозитория.
   Важно: папка functions должна лежать рядом с index.html.

ШАГ 3. Опубликуй на Cloudflare Pages
1. Создай бесплатный аккаунт на https://dash.cloudflare.com
2. Открой Workers & Pages → Create → Pages → Connect to Git.
3. Подключи GitHub и выбери репозиторий AURA AI.
4. Выбери framework preset: None.
5. Build command: exit 0.
6. Build output directory: . (точка — корень репозитория).
7. Нажми Save and Deploy.
7. Дождись адреса вида https://имя-проекта.pages.dev

ШАГ 4. Добавь секрет API-ключа
1. В Cloudflare открой свой Pages-проект → Settings → Variables and Secrets.
2. Добавь переменную типа Secret:
   GEMINI_API_KEY = твой ключ из Google AI Studio
3. Не добавляй ключ как обычную публичную переменную.
4. (Необязательно) Добавь обычную переменную GEMINI_MODEL со значением gemini-3.1-flash-lite.
5. Сохрани изменения и запусти новую сборку/Deploy, чтобы секрет применился к Functions.

ШАГ 5. Проверь
1. Открой сайт Pages по HTTPS.
2. Напиши AURA: «Привет! Как тебя зовут?»
3. Если ответ пришёл от Gemini — подключение работает.
4. На Android открой сайт в Chrome → меню → «Установить приложение» / «Добавить на главный экран».
5. На Windows открой сайт в Chrome или Edge → значок установки в адресной строке или меню «Установить приложение».

ВАЖНО О БЕЗОПАСНОСТИ И БЕСПЛАТНОСТИ
- Не публикуй API-ключ и не присылай его мне.
- Бесплатные квоты ограничены, могут меняться и зависят от модели/региона/проекта.
- В бесплатном тарифе Gemini содержимое запросов может использоваться Google для улучшения продуктов; не отправляй пароли, финансовые, медицинские или другие конфиденциальные данные.
- Cloudflare Free имеет лимиты. Следи за текущими условиями и настройками расходов.
- Этот стартовый проект не содержит аккаунтов пользователей, базы истории, защиты от злоупотреблений или персонального лимита на посетителя. Пока не делись публичной ссылкой с широкой аудиторией.
- Если модель недоступна в твоём аккаунте, проверь доступные модели в Google AI Studio и задай GEMINI_MODEL на имя доступной модели с бесплатным тарифом.

Локальный тест (опционально, для тех, кто умеет пользоваться терминалом):
- Установи Node.js и Wrangler.
- Создай .dev.vars в корне:
  GEMINI_API_KEY=твой_ключ
  GEMINI_MODEL=gemini-3.1-flash-lite
- Запусти: npx wrangler pages dev .
- Открой локальный адрес, который покажет Wrangler.

Ссылки:
Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
Gemini API quickstart: https://ai.google.dev/gemini-api/docs/quickstart
Gemini API rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
Cloudflare Pages Git integration: https://developers.cloudflare.com/pages/get-started/git-integration/
