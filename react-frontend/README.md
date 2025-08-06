# React Frontend

## Project Setup

This is the frontend for the file management system, built with React and TypeScript.

## Temporary Workarounds

Due to dependency installation issues, the following temporary workarounds are in place:

1. Missing type definitions for React and related packages:
   - Added @ts-ignore comments for imports
   - Created global.d.ts for react/jsx-runtime types
   - Disabled strict mode in tsconfig.json

2. File/FileItem type mismatch:
   - Added type assertions in FileUpload component

These should be removed once proper type definitions can be installed.

## Development

To start the development server:

```bash
yarn start
```
