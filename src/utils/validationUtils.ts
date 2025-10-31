const doesNotContainWhitespaces = (value: string) => {
  return !/\s/.test(value);
};

const isNotEmpty = (value: string) => {
  return value.length > 0;
};

export const isFilledNoWhitespaces = (value: string) => {
  return doesNotContainWhitespaces(value) && isNotEmpty(value);
};
