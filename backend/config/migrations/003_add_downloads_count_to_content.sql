-- Добавляем поле downloads_count в таблицу content
ALTER TABLE content ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0;

-- Обновляем существующие записи, устанавливая downloads_count = 0
UPDATE content SET downloads_count = 0 WHERE downloads_count IS NULL;
