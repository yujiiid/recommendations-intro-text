const PLACEHOLDER_REGEX = /\$\{([a-zA-Z0-9_]+)\}/g;

export type PromptTemplateWarningCode =
  | 'PROMPT_TEMPLATE_MISSING'
  | 'PROMPT_TEMPLATE_MISSING_REQUIRED_PLACEHOLDERS'
  | 'PROMPT_TEMPLATE_UNKNOWN_PLACEHOLDER';

export interface PromptTemplateWarning {
  code: PromptTemplateWarningCode;
  message: string;
  placeholders?: string[];
}

export interface RenderPromptTemplateParams {
  template: string | null | undefined;
  fallbackTemplate: string;
  context: Record<string, unknown>;
  requiredPlaceholders: readonly string[];
}

export interface RenderPromptTemplateResult {
  renderedPrompt: string;
  warnings: PromptTemplateWarning[];
}

const renderTemplate = (
  template: string,
  context: Record<string, unknown>,
): { renderedPrompt: string; unknownPlaceholders: string[] } => {
  const unknownPlaceholders = new Set<string>();

  const renderedPrompt = template.replace(PLACEHOLDER_REGEX, (_match, key) => {
    const parameterName = String(key).trim();
    const parameterValue = context[parameterName];

    if (parameterValue === undefined || parameterValue === null) {
      unknownPlaceholders.add(parameterName);
      return '';
    }

    return String(parameterValue);
  });

  return {
    renderedPrompt,
    unknownPlaceholders: Array.from(unknownPlaceholders).sort((a, b) =>
      a.localeCompare(b),
    ),
  };
};

const extractPlaceholders = (template: string): Set<string> => {
  const placeholders = new Set<string>();

  for (const match of template.matchAll(PLACEHOLDER_REGEX)) {
    const parameterName = match[1]?.trim();
    if (parameterName) {
      placeholders.add(parameterName);
    }
  }

  return placeholders;
};

export const renderPromptTemplate = ({
  template,
  fallbackTemplate,
  context,
  requiredPlaceholders,
}: RenderPromptTemplateParams): RenderPromptTemplateResult => {
  const warnings: PromptTemplateWarning[] = [];
  const trimmedTemplate = template?.trim() ?? '';
  let effectiveTemplate = trimmedTemplate;

  if (!trimmedTemplate) {
    effectiveTemplate = fallbackTemplate;
    warnings.push({
      code: 'PROMPT_TEMPLATE_MISSING',
      message: `AI prompt is missing. Falling back to default template.`,
    });
  } else {
    const placeholders = extractPlaceholders(trimmedTemplate);
    const missingRequiredPlaceholders = requiredPlaceholders.filter(
      (requiredPlaceholder) => !placeholders.has(requiredPlaceholder),
    );

    if (missingRequiredPlaceholders.length > 0) {
      effectiveTemplate = fallbackTemplate;
      warnings.push({
        code: 'PROMPT_TEMPLATE_MISSING_REQUIRED_PLACEHOLDERS',
        message: `AI prompt is missing required placeholders. Falling back to default template.`,
        placeholders: [...missingRequiredPlaceholders],
      });
    }
  }

  const { renderedPrompt, unknownPlaceholders } = renderTemplate(
    effectiveTemplate,
    context,
  );

  if (unknownPlaceholders.length > 0) {
    warnings.push({
      code: 'PROMPT_TEMPLATE_UNKNOWN_PLACEHOLDER',
      message: `AI prompt includes placeholders that are not available in runtime context.`,
      placeholders: unknownPlaceholders,
    });
  }

  return {
    renderedPrompt,
    warnings,
  };
};
