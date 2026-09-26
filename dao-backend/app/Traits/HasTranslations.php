<?php

namespace App\Traits;

use App\Enums\Locale;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Content with a `<model>_translations` table (one row per locale).
 * Reads fall back field-by-field through Locale::fallbackChain(), so a missing
 * Myanmar description shows the English one instead of an empty string or a key.
 */
trait HasTranslations
{
    abstract public function translations(): HasMany;

    public function translated(string $field, ?string $locale = null): ?string
    {
        $translations = $this->relationLoaded('translations') ? $this->translations : $this->translations()->get();

        foreach (Locale::fallbackChain($locale ?? app()->getLocale()) as $candidate) {
            $value = $translations->firstWhere('locale', $candidate)?->{$field};
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        foreach ($translations as $translation) {
            if (($translation->{$field} ?? '') !== '') {
                return $translation->{$field};
            }
        }

        return null;
    }

    /**
     * @param  array<string, array<string, mixed>>  $byLocale  ['en' => ['name' => …], 'th' => [...]]
     */
    public function syncTranslations(array $byLocale): void
    {
        foreach ($byLocale as $locale => $fields) {
            if (Locale::tryFrom((string) $locale) === null || ! is_array($fields)) {
                continue;
            }
            $this->translations()->updateOrCreate(['locale' => $locale], $fields);
        }
        $this->unsetRelation('translations');
    }

    /** @return array<string, array<string, mixed>> keyed by locale (admin editing) */
    public function translationsByLocale(): array
    {
        return $this->translations
            ->mapWithKeys(fn (Model $t) => [$t->locale => collect($t->attributesToArray())->except(['id', 'locale', $this->getForeignKey()])->all()])
            ->all();
    }
}
