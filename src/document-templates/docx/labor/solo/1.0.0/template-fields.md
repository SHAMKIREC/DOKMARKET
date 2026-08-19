# labor-solo@1.0.0

Спецификация для ручного создания настоящего `template.docx`. HTML `altChunk` не используется.

## Одиночные placeholders

- `{document.title}`
- `{document.subtitle}`
- `{document.date}`
- `{claimant.fullName}`
- `{claimant.address}`
- `{claimant.phone}`
- `{claimant.email}`
- `{claimant.position}`
- `{respondent.displayName}`
- `{respondent.address}`
- `{respondent.inn}`
- `{respondent.registrationNumberLabel}`
- `{respondent.registrationNumber}`
- `{facts.workStartDate}`
- `{facts.workEndText}`
- `{facts.workplaceAddress}`
- `{facts.debtAmount}`
- `{facts.originalDebtAmount}`
- `{facts.partialPaymentAmount}`
- `{facts.description}`
- `{facts.paymentForm}`
- `{deadlines.responseTermText}`

## Цикл правовых оснований

```text
{#legalGrounds}
{number}. {citation} — {title}. {text}
{/legalGrounds}
```

## Цикл требований

```text
{#demands}
{number}. {text} {amount}
{/demands}
```

## Цикл приложений

```text
{#evidence}
{number}. {label}. {description} {filesText}
{/evidence}
```

`template.docx` нужно создать вручную в этой папке. Каждый tag следует вводить в Word одним фрагментом, без разного форматирования внутри фигурных скобок.

