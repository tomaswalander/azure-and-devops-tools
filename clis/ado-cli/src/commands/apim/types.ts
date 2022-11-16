import { ApiCreateOrUpdateParameter } from '@azure/arm-apimanagement';
import { OpenAPIV2 } from 'openapi-types';

type NonChangeableProps = 'protocols' | 'format' | 'value';
type ApimMandatoryProps = 'displayName' | 'description' | 'path';

type AdditionalParameters = Omit<
  ApiCreateOrUpdateParameter,
  NonChangeableProps | ApimMandatoryProps
>;

export interface PublishToApimOptions
  extends Required<Pick<ApiCreateOrUpdateParameter, ApimMandatoryProps>> {
  subscriptionId: string;
  resourceGroupName: string;
  apiManagementName: string;

  name: string;
  openApiSpec: OpenAPIV2.Document;
  products: string[];

  parameters?: AdditionalParameters;

  apply?: boolean;
}

export interface PublishToApimWithOperationIdFilterOptions
  extends PublishToApimOptions {
  operationIds: string[] | null;
}

export type GlobalProps =
  | 'subscriptionId'
  | 'apiManagementName'
  | 'resourceGroupName';

export type ApiConfig = Omit<
  PublishToApimWithOperationIdFilterOptions,
  'openApiSpec' | GlobalProps
>;
