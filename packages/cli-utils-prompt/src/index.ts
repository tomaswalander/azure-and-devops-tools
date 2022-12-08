import prompts from 'prompts';

type ValidateOrPromptOptions = {
  isValid: (v?: string) => boolean;
  choices?: string[];
  initial?: string;
};

export const validateStringOrPrompt = async (
  question: string,
  potentialValue?: string,
  opts?: ValidateOrPromptOptions,
): Promise<string> => {
  const { isValid = (v?: string) => !!v, choices, initial } = opts ?? {};
  if (potentialValue && isValid(potentialValue)) {
    return potentialValue;
  }
  const response = await prompts({
    type: choices ? 'select' : 'text',
    name: 'value',
    message: question,
    validate: isValid,
    choices: choices?.map(c => ({ title: c, value: c })) ?? undefined,
    initial,
  });

  return response.value;
};
