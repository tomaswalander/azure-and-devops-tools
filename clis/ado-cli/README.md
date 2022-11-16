```text
     _      ____     ___       ____   _       ___
    / \    |  _ \   / _ \     / ___| | |     |_ _|
   / _ \   | | | | | | | |   | |     | |      | |
  / ___ \  | |_| | | |_| |   | |___  | |___   | |
 /_/   \_\ |____/   \___/     \____| |_____| |___|

```

A cli for custom Azure and Azure DevOps tasks I find myself often doing in projects.

[![verify](https://github.com/tomaswalander/azure-and-devops-tools/actions/workflows/verify.yml/badge.svg?branch=master)](https://github.com/tomaswalander/azure-and-devops-tools/actions/workflows/verify.yml)


> **DISCLAIMER:** This is my very first npm package - I'm happy to recieve feedback about anything and everything to improve!

<br>

# Installation

Easiest way is to run it using `npx`
```
npx @twalander/ado-cli
```

or if you prefer to install it

```bash
npm i -g @twalander/ado-cli
```
after which you could run it as: 
```
ado-cli --help
``` 
However, it may depend on your system and/or shell setup.

<br>

# Usage

In general, the `--help` is a good place to start.

```
npx @twalander/ado-cli --help
```

## Api Management - `ado-cli apim`

This "namespace" contains commands for working with Azure Api Management.

> _ApiM_ is MS' recommended abbreviation for Api Management https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations

### Publish - `ado-cli apim publish`

Publishing to ApiM is quite straight forwar E.g., if your webapp provides an OpenApi in json or yaml format you can simply task ApiM to import it. 

However, sometimmes you do NOT want all endpoints of a webapp automatically picked up by ApiM. But you may also not want to exclude them from OpenApi as that may be used internally for testing. And other times you want one webapp to have more than one ApiM api - each with a subset of the available endpoints of your webapp. 

This command allows you to import an OpenApi specification but with the additional capabilities of: 

1. Filtering the specification by `operationId`
2. Publishing more than one API from the same OpenApi specification. E.g., you want some operations in an "internal only" Api.
3. Assign an Api to an ApiM product. **Note:** The product must already exist.

**Usage**
```bash
npx @twalander/ado-cli publish \
  -g rg-where-my-apim-is \
  -n apim-instance \
  -s <subscription-id> \
  -u https://path-to-accessible-open-api-spec.myapp.net \
  [-c <path-to-optional-api-config.json>]
```
If api config is omitted the cli will attempt to import the entire OpenApi specification - as is - to ApiM.

**Example Api Config**
```json 
[
  {
    "displayName": "Admin Api",
    "description": "This api is available to subscribers of the Apim product",
    "path": "admin/api",
    "operationIds": ["admin-list-users"],
    "name": "admin-api",
    "products": ["admin-product"],
  },
  {
    "displayName": "Web Api",
    "description": "This api is available to subscribers of the Web product",
    "path": "api",
    "operationIds": ["get-logged-in-user-profile", "update-profile"],
    "name": "api",
    "products": ["web-product"],
  },
]
```
The above would create two apis as: 

1. Admin Api
    - available `https://your-apim.azure-api/admin/api/...`
    - containing one operation
    - only accessibly to any client subscribing to the `admin-product`.
2. Web api
    - available at `https://your-apim.azure-api/admin/api/...`
    - containing two operations
    - only accessible to any client subscribing to the web-product

<br>

# Issues
Please, open an issue here: https://github.com/tomaswalander/azure-and-devops-tools/issues

As this is a hobby project of mine I cannot really give any guarantees if/when I will have time to address them. 

I will happily accept PR:s that I feel align with the scope/purpose of the CLI.

<br>

# Road map

This is a VERY early version of the CLI. I recently realised I had aggregated quite a bunch of Azure and Azure DevOps tools and I thought it would be nice to Open Source them and hopefully others will find them as useful as I do. 

Some things that I plan to add: 

1. Manage PR-approval rights in an Azure DevOps repository using `owner` files in the file tree.
2. A simply "IAM-as-code" for Azure

And more things I have not yet decided how I want to publish...
