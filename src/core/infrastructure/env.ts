import { Env } from "../types/env";

function validateEnv(env: Env): void {
  const shareValues = [
    env.minShareValue,
    env.midLowShareValue,
    env.midHighShareValue,
    env.maxShareValue,
  ];
  const sortedShareValues = [...shareValues].sort((a, b) => a - b);
  if (!shareValues.every((el, idx) => sortedShareValues[idx] === el)) {
    throw new Error(
      `The 4 share value thresholds don't match this condition: ${env.minShareValue} <= ${env.midLowShareValue} <= ${env.midHighShareValue} <= ${env.maxShareValue}`
    );
  }
}

export function getEnv(sourceEnv: Record<string, any>): Env {
  const defaultMinShareValue = 3;
  const defaultMidLowShareValue = 10;
  const defaultMidHighShareValue = 25;
  const defaultMaxShareValue = 200;

  const defaultCheapestPercentage = 0.95;
  const defaultMostExpensivePercentage = 0.02;

  const defaultIsPercentagesStrategy = true;

  const getEnvVar = <T>(
    key: string,
    transform: (arg: any) => T,
    defaultValue: T
  ): T => {
    return sourceEnv[key] ? transform(sourceEnv[key]) : defaultValue;
  };

  const env: Env = {
    minShareValue: getEnvVar(
      "minShareValue",
      Number.parseFloat,
      defaultMinShareValue
    ),
    midLowShareValue: getEnvVar(
      "midLowShareValue",
      Number.parseFloat,
      defaultMidLowShareValue
    ),
    midHighShareValue: getEnvVar(
      "midHighShareValue",
      Number.parseFloat,
      defaultMidHighShareValue
    ),
    maxShareValue: getEnvVar(
      "maxShareValue",
      Number.parseFloat,
      defaultMaxShareValue
    ),
    cheapestPercentage: getEnvVar(
      "cheapestPercentage",
      Number.parseFloat,
      defaultCheapestPercentage
    ),
    mostExpensivePercentage: getEnvVar(
      "mostExpensivePercentage",
      Number.parseFloat,
      defaultMostExpensivePercentage
    ),
  };

  validateEnv(env);

  console.log("Current environment variables:", env);

  return env;
}
