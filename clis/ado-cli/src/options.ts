import { Command, Option } from 'commander';

const subscriptionIdOption = new Option(
  '-s, --subscription-id <string>',
  'The id of the Azure Subscription. Can be sourced from environment variable AZ_SUBSCRIPTION_ID.',
);
subscriptionIdOption.defaultValue = process.env.AZ_SUBSCRIPTION_ID;

export const withApimInstanceOptions = (c: Command): Command => {
  c.requiredOption(
    '-n, --api-management-name <string>',
    'The name of the Api Management instance',
  )
    .requiredOption(
      '-g, --resource-group-name <string>',
      'The name of the resource group where the Api Management instance is located',
    )
    .addOption(subscriptionIdOption);
  return c;
};
